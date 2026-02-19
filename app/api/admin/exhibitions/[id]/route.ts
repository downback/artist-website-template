import { NextResponse } from "next/server"
import {
  exhibitionCategories,
  type ExhibitionCategory,
  siteAssetsBucketName,
} from "@/lib/constants"
import { buildStoragePathWithPrefix } from "@/lib/storage"
import { insertActivityLog, requireAdminUser } from "@/lib/server/adminRoute"
import { toSlug } from "@/lib/utils"
import {
  insertAdditionalExhibitionImages,
  removeAdditionalExhibitionImages,
  rollbackExhibitionUpdate,
} from "@/lib/server/exhibitionMutation"
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
    const category = formData.get("category")?.toString().trim()
    const exhibitionTitle = formData.get("exhibition_title")?.toString().trim()
    const caption = formData.get("caption")?.toString().trim()
    const description = formData.get("description")?.toString().trim()
    const additionalFiles = formData
      .getAll("additional_images")
      .filter((value): value is File => value instanceof File)
    const removedAdditionalImageIds = formData
      .getAll("removedAdditionalImageIds")
      .map((value) => value.toString().trim())
      .filter((value) => value.length > 0)

    const isAllowedCategory = (value: string): value is ExhibitionCategory =>
      exhibitionCategories.includes(value as ExhibitionCategory)

    if (!category || !isAllowedCategory(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 })
    }

    if (!exhibitionTitle) {
      return NextResponse.json(
        { error: "Exhibition title is required." },
        { status: 400 },
      )
    }

    if (!caption) {
      return NextResponse.json(
        { error: "Caption is required." },
        { status: 400 },
      )
    }

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

    if (removedAdditionalImageIds.some((imageId) => !isUuid(imageId))) {
      return NextResponse.json(
        { error: "Invalid additional image id." },
        { status: 400 },
      )
    }

    const { data: imageRow, error: imageError } = await supabase
      .from("exhibition_images")
      .select("storage_path, exhibition_id, is_primary")
      .eq("id", id)
      .maybeSingle()

    if (imageError || !imageRow?.storage_path || !imageRow.exhibition_id) {
      return NextResponse.json(
        { error: "Exhibition not found." },
        { status: 404 },
      )
    }

    const { data: exhibition, error: exhibitionError } = await supabase
      .from("exhibitions")
      .select("id, type, title, slug, description")
      .eq("id", imageRow.exhibition_id)
      .maybeSingle()

    if (exhibitionError || !exhibition?.id) {
      return NextResponse.json(
        { error: "Exhibition not found." },
        { status: 404 },
      )
    }

    const exhibitionType = category === "solo-exhibitions" ? "solo" : "group"
    const slug = toSlug(exhibitionTitle)
    if (!slug) {
      return NextResponse.json(
        { error: "Exhibition title is required." },
        { status: 400 },
      )
    }

    const { error: exhibitionUpdateError } = await supabase
      .from("exhibitions")
      .update({
        type: exhibitionType,
        title: exhibitionTitle,
        slug,
        description: description || null,
      })
      .eq("id", exhibition.id)

    if (exhibitionUpdateError) {
      return NextResponse.json(
        { error: exhibitionUpdateError.message },
        { status: 500 },
      )
    }

    let nextStoragePath = imageRow.storage_path
    if (file instanceof File) {
      const mainImageValidationError = validateImageUploadFile(file)
      if (mainImageValidationError) {
        return NextResponse.json(
          { error: mainImageValidationError },
          { status: 400 },
        )
      }
      nextStoragePath = buildStoragePathWithPrefix({
        prefix: `${category}/${slug}`,
        file,
      })
      const { error: uploadError } = await uploadStorageFile({
        supabase,
        bucketName,
        storagePath: nextStoragePath,
        file,
      })

      if (uploadError) {
        await rollbackExhibitionUpdate(supabase, exhibition)
        return NextResponse.json(
          { error: "Upload failed. Please try again." },
          { status: 500 },
        )
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("exhibition_images")
      .update({
        storage_path: nextStoragePath,
        caption,
      })
      .eq("id", id)
      .select("id, created_at, storage_path")
      .single()

    if (updateError || !updated) {
      if (nextStoragePath !== imageRow.storage_path) {
        await removeStoragePathsSafely({
          supabase,
          bucketName,
          storagePaths: [nextStoragePath],
          logContext: "Exhibition update main image rollback",
        })
      }
      await rollbackExhibitionUpdate(supabase, exhibition)
      return NextResponse.json(
        { error: updateError?.message || "Unable to update exhibition." },
        { status: 500 },
      )
    }

    if (nextStoragePath !== imageRow.storage_path) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [imageRow.storage_path],
        logContext: "Exhibition update old main image cleanup",
      })
    }

    if (additionalFiles.length > 0) {
      const { data: latestImage, error: latestImageError } = await supabase
        .from("exhibition_images")
        .select("display_order")
        .eq("exhibition_id", imageRow.exhibition_id)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestImageError) {
        await rollbackExhibitionUpdate(supabase, exhibition)
        return NextResponse.json(
          { error: latestImageError.message },
          { status: 500 },
        )
      }

      const baseDisplayOrder = (latestImage?.display_order ?? -1) + 1
      const additionalImageInsertResult =
        await insertAdditionalExhibitionImages({
          supabase,
          bucketName,
          exhibitionId: imageRow.exhibition_id,
          caption,
          category,
          slug,
          additionalFiles,
          startDisplayOrder: baseDisplayOrder,
        })
      if (additionalImageInsertResult.errorMessage) {
        await rollbackExhibitionUpdate(supabase, exhibition)
        return NextResponse.json(
          { error: additionalImageInsertResult.errorMessage },
          { status: 500 },
        )
      }
    }

    if (removedAdditionalImageIds.length > 0) {
      const removeAdditionalResult = await removeAdditionalExhibitionImages({
        supabase,
        bucketName,
        exhibitionId: imageRow.exhibition_id,
        removedAdditionalImageIds,
      })
      if (removeAdditionalResult.errorMessage) {
        await rollbackExhibitionUpdate(supabase, exhibition)
        return NextResponse.json(
          { error: removeAdditionalResult.errorMessage },
          { status: removeAdditionalResult.status },
        )
      }
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "update",
      entityType: "exhibition",
      entityId: updated.id,
      metadata: { category },
      logContext: "Exhibition update",
    })

    return NextResponse.json({ ok: true, createdAt: updated.created_at })
  } catch (error) {
    console.error("Exhibition update failed", { error })
    return NextResponse.json(
      { error: "Server error while updating exhibition." },
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

    const { data: imageRow, error: imageError } = await supabase
      .from("exhibition_images")
      .select("storage_path, exhibition_id, is_primary")
      .eq("id", id)
      .maybeSingle()

    if (imageError || !imageRow?.storage_path || !imageRow.exhibition_id) {
      return NextResponse.json(
        { error: "Exhibition not found." },
        { status: 404 },
      )
    }

    const { data: exhibitionRow, error: exhibitionError } = await supabase
      .from("exhibitions")
      .select("type")
      .eq("id", imageRow.exhibition_id)
      .maybeSingle()

    if (exhibitionError) {
      console.error("Failed to load exhibition for delete", {
        message: exhibitionError.message,
      })
    }

    if (!imageRow.is_primary) {
      const { error: deleteImageError } = await supabase
        .from("exhibition_images")
        .delete()
        .eq("id", id)

      if (deleteImageError) {
        return NextResponse.json(
          { error: deleteImageError.message || "Unable to delete image." },
          { status: 500 },
        )
      }

      await supabase.storage.from(bucketName).remove([imageRow.storage_path])

      const { error: activityError } = await supabase
        .from("activity_log")
        .insert({
          admin_id: user.id,
          action_type: "delete",
          entity_type: "exhibition_image",
          entity_id: id,
          metadata: {
            category:
              exhibitionRow?.type === "solo"
                ? "solo-exhibitions"
                : exhibitionRow?.type === "group"
                  ? "group-exhibitions"
                  : "exhibitions",
          },
        })

      if (activityError) {
        console.warn("Activity log insert failed", {
          message: activityError.message,
          details: activityError.details,
          hint: activityError.hint,
        })
      }

      return NextResponse.json({ ok: true })
    }

    const { data: allImages, error: allImagesError } = await supabase
      .from("exhibition_images")
      .select("id, storage_path")
      .eq("exhibition_id", imageRow.exhibition_id)

    if (allImagesError) {
      console.error("Failed to load all exhibition images", {
        message: allImagesError.message,
      })
    }

    const storagePaths =
      allImages
        ?.map((img) => img.storage_path)
        .filter((path): path is string => Boolean(path)) ?? []

    const { error: deleteError } = await supabase
      .from("exhibition_images")
      .delete()
      .eq("exhibition_id", imageRow.exhibition_id)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Unable to delete exhibition." },
        { status: 500 },
      )
    }

    if (storagePaths.length > 0) {
      await supabase.storage.from(bucketName).remove(storagePaths)
    }

    const { error: exhibitionDeleteError } = await supabase
      .from("exhibitions")
      .delete()
      .eq("id", imageRow.exhibition_id)

    if (exhibitionDeleteError) {
      return NextResponse.json(
        {
          error:
            exhibitionDeleteError.message || "Unable to delete exhibition.",
        },
        { status: 500 },
      )
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "delete",
      entityType: "exhibition",
      entityId: id,
      metadata: {
        category:
          exhibitionRow?.type === "solo"
            ? "solo-exhibitions"
            : exhibitionRow?.type === "group"
              ? "group-exhibitions"
              : "exhibitions",
      },
      logContext: "Exhibition delete",
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Exhibition delete failed", { error })
    return NextResponse.json(
      { error: "Server error while deleting exhibition." },
      { status: 500 },
    )
  }
}
