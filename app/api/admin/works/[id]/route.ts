import { NextResponse } from "next/server"
import { siteAssetsBucketName } from "@/lib/constants"
import {
  validateWorkMetadata,
  type WorkMetadataValidationData,
} from "@/lib/requestValidation"
import { buildStoragePathWithPrefix } from "@/lib/storage"
import {
  insertAdditionalArtworkImages,
  removeAdditionalArtworkImages,
  updateAdditionalArtworkCaptions,
} from "@/lib/server/artworkMutation"
import { insertActivityLog, requireAdminUser } from "@/lib/server/adminRoute"
import {
  removeStoragePathsSafely,
  uploadStorageFile,
} from "@/lib/server/storageTransaction"
import { supabaseServer } from "@/lib/server"
import { validateImageUploadFile } from "@/lib/uploadValidation"
import { isUuid } from "@/lib/validation"

const bucketName = siteAssetsBucketName

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 })
    }

    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const additionalFiles = formData
      .getAll("additional_images")
      .filter((value): value is File => value instanceof File)
    const additionalImageCaptions = formData
      .getAll("additional_image_captions")
      .map((value) => value.toString())
    const existingAdditionalImageIds = formData
      .getAll("existing_additional_image_ids")
      .map((value) => value.toString().trim())
      .filter((value) => value.length > 0)
    const existingAdditionalImageCaptions = formData
      .getAll("existing_additional_image_captions")
      .map((value) => value.toString())
    const removedAdditionalImageIds = formData
      .getAll("removedAdditionalImageIds")
      .map((value) => value.toString().trim())
      .filter((value) => value.length > 0)
    const yearRaw = formData.get("year")?.toString().trim()
    const title = formData.get("title")?.toString().trim()
    const caption = formData.get("caption")?.toString().trim()

    const metadataValidationResult = validateWorkMetadata({
      yearRaw: yearRaw ?? "",
      title: title ?? "",
      caption: caption ?? "",
    })
    if (
      !metadataValidationResult.data ||
      metadataValidationResult.errorMessage
    ) {
      return NextResponse.json(
        {
          error:
            metadataValidationResult.errorMessage || "Invalid request body.",
        },
        { status: 400 },
      )
    }
    const validatedData =
      metadataValidationResult.data as WorkMetadataValidationData
    const {
      year,
      title: normalizedTitle,
      caption: normalizedCaption,
    } = validatedData

    const invalidAdditionalImage = additionalFiles.find(
      (additional) => validateImageUploadFile(additional) !== null,
    )
    if (invalidAdditionalImage) {
      const additionalValidationError = validateImageUploadFile(
        invalidAdditionalImage,
      )
      return NextResponse.json(
        {
          error: additionalValidationError || "Only image uploads are allowed.",
        },
        { status: 400 },
      )
    }

    if (additionalFiles.length !== additionalImageCaptions.length) {
      return NextResponse.json(
        { error: "Additional image captions are invalid." },
        { status: 400 },
      )
    }

    if (existingAdditionalImageIds.length !== existingAdditionalImageCaptions.length) {
      return NextResponse.json(
        { error: "Existing additional image captions are invalid." },
        { status: 400 },
      )
    }

    if (
      removedAdditionalImageIds.some((imageId) => !isUuid(imageId)) ||
      existingAdditionalImageIds.some((imageId) => !isUuid(imageId))
    ) {
      return NextResponse.json(
        { error: "Invalid additional image id." },
        { status: 400 },
      )
    }

    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (artworkError || !artwork?.id) {
      return NextResponse.json({ error: "Work not found." }, { status: 404 })
    }

    const { data: primaryImage, error: primaryImageError } = await supabase
      .from("artwork_images")
      .select("id, storage_path")
      .eq("artwork_id", id)
      .eq("is_primary", true)
      .maybeSingle()

    if (primaryImageError || !primaryImage?.id || !primaryImage.storage_path) {
      return NextResponse.json({ error: "Work image not found." }, { status: 404 })
    }

    let nextStoragePath = primaryImage.storage_path
    if (file instanceof File) {
      const fileValidationError = validateImageUploadFile(file)
      if (fileValidationError) {
        return NextResponse.json(
          { error: fileValidationError },
          { status: 400 },
        )
      }
      nextStoragePath = buildStoragePathWithPrefix({
        prefix: "works",
        file,
      })
      const { error: uploadError } = await uploadStorageFile({
        supabase,
        bucketName,
        storagePath: nextStoragePath,
        file,
      })

      if (uploadError) {
        return NextResponse.json(
          { error: "Upload failed. Please try again." },
          { status: 500 },
        )
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("artworks")
      .update({
        year,
        title: normalizedTitle,
      })
      .eq("id", id)
      .select("id, created_at")
      .single()

    if (updateError || !updated) {
      if (nextStoragePath !== primaryImage.storage_path) {
        await removeStoragePathsSafely({
          supabase,
          bucketName,
          storagePaths: [nextStoragePath],
          logContext: "Work update rollback",
        })
      }
      return NextResponse.json(
        { error: updateError?.message || "Unable to update work." },
        { status: 500 },
      )
    }

    const { error: imageUpdateError } = await supabase
      .from("artwork_images")
      .update({
        storage_path: nextStoragePath,
        caption: normalizedCaption,
      })
      .eq("id", primaryImage.id)

    if (imageUpdateError) {
      if (nextStoragePath !== primaryImage.storage_path) {
        await removeStoragePathsSafely({
          supabase,
          bucketName,
          storagePaths: [nextStoragePath],
          logContext: "Work image update rollback",
        })
      }
      return NextResponse.json(
        { error: imageUpdateError.message || "Unable to update work image." },
        { status: 500 },
      )
    }

    if (nextStoragePath !== primaryImage.storage_path) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [primaryImage.storage_path],
        logContext: "Work update old-file cleanup",
      })
    }

    const filteredExistingAdditionalCaptions = existingAdditionalImageIds
      .map((imageId, index) => ({
        id: imageId,
        caption: existingAdditionalImageCaptions[index] ?? "",
      }))
      .filter((item) => !removedAdditionalImageIds.includes(item.id))

    if (filteredExistingAdditionalCaptions.length > 0) {
      const updateAdditionalCaptionsResult = await updateAdditionalArtworkCaptions({
        supabase,
        artworkId: id,
        captionsByImageId: filteredExistingAdditionalCaptions,
      })
      if (updateAdditionalCaptionsResult.errorMessage) {
        return NextResponse.json(
          { error: updateAdditionalCaptionsResult.errorMessage },
          { status: updateAdditionalCaptionsResult.status },
        )
      }
    }

    if (additionalFiles.length > 0) {
      const { data: latestImage, error: latestImageError } = await supabase
        .from("artwork_images")
        .select("display_order")
        .eq("artwork_id", id)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestImageError) {
        return NextResponse.json(
          { error: latestImageError.message || "Unable to load work images." },
          { status: 500 },
        )
      }

      const baseDisplayOrder = (latestImage?.display_order ?? -1) + 1
      const additionalImageInsertResult = await insertAdditionalArtworkImages({
        supabase,
        bucketName,
        artworkId: id,
        additionalImages: additionalFiles.map((additionalFile, index) => ({
          file: additionalFile,
          caption: additionalImageCaptions[index] ?? "",
        })),
        startDisplayOrder: baseDisplayOrder,
      })

      if (additionalImageInsertResult.errorMessage) {
        return NextResponse.json(
          { error: additionalImageInsertResult.errorMessage },
          { status: 500 },
        )
      }
    }

    if (removedAdditionalImageIds.length > 0) {
      const removeAdditionalResult = await removeAdditionalArtworkImages({
        supabase,
        bucketName,
        artworkId: id,
        removedAdditionalImageIds,
      })
      if (removeAdditionalResult.errorMessage) {
        return NextResponse.json(
          { error: removeAdditionalResult.errorMessage },
          { status: removeAdditionalResult.status },
        )
      }
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "update",
      entityType: "artwork",
      entityId: updated.id,
      metadata: { category: "works" },
      logContext: "Work update",
    })

    return NextResponse.json({ ok: true, createdAt: updated.created_at })
  } catch (error) {
    console.error("Work update failed", { error })
    return NextResponse.json(
      { error: "Server error while updating work." },
      { status: 500 },
    )
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 })
    }

    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (artworkError || !artwork?.id) {
      return NextResponse.json({ error: "Work not found." }, { status: 404 })
    }

    const { data: artworkImages, error: artworkImagesError } = await supabase
      .from("artwork_images")
      .select("storage_path")
      .eq("artwork_id", id)

    if (artworkImagesError) {
      return NextResponse.json(
        { error: artworkImagesError.message || "Unable to load work images." },
        { status: 500 },
      )
    }

    const storagePaths =
      artworkImages
        ?.map((image) => image.storage_path)
        .filter((path): path is string => Boolean(path)) ?? []

    const { error: deleteError } = await supabase
      .from("artworks")
      .delete()
      .eq("id", id)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Unable to delete work." },
        { status: 500 },
      )
    }

    await removeStoragePathsSafely({
      supabase,
      bucketName,
      storagePaths,
      logContext: "Work delete storage cleanup",
    })

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "delete",
      entityType: "artwork",
      entityId: id,
      metadata: { category: "works" },
      logContext: "Work delete",
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Work delete failed", { error })
    return NextResponse.json(
      { error: "Server error while deleting work." },
      { status: 500 },
    )
  }
}
