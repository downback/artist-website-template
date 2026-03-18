import { NextResponse } from "next/server"
import { siteAssetsBucketName } from "@/lib/constants"
import { buildStoragePathWithPrefix } from "@/lib/storage"
import { insertAdditionalArtworkImages } from "@/lib/server/artworkMutation"
import {
  validateWorkMetadata,
  type WorkMetadataValidationData,
} from "@/lib/requestValidation"
import {
  createMappedSupabaseErrorResponse,
  insertActivityLog,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import {
  removeStoragePathsSafely,
  uploadStorageFile,
} from "@/lib/server/storageTransaction"
import { supabaseServer } from "@/lib/server"
import { validateImageUploadFile } from "@/lib/uploadValidation"

const bucketName = siteAssetsBucketName

export async function POST(request: Request) {
  try {
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
    const yearRaw = formData.get("year")?.toString().trim()
    const title = formData.get("title")?.toString().trim()
    const caption = formData.get("caption")?.toString().trim()

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing image file." },
        { status: 400 },
      )
    }

    const fileValidationError = validateImageUploadFile(file)
    if (fileValidationError) {
      return NextResponse.json({ error: fileValidationError }, { status: 400 })
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

    const storagePath = buildStoragePathWithPrefix({
      prefix: "works",
      file,
    })
    const { error: uploadError } = await uploadStorageFile({
      supabase,
      bucketName,
      storagePath,
      file,
    })

    if (uploadError) {
      return NextResponse.json(
        { error: "Upload failed. Please try again." },
        { status: 500 },
      )
    }

    const { data: latestArtwork, error: latestError } = await supabase
      .from("artworks")
      .select("display_order")
      .eq("category", "works")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [storagePath],
        logContext: "Work create rollback",
      })
      return createMappedSupabaseErrorResponse({
        message: latestError.message,
        tableHint: "artworks",
        fallbackMessage: "Unable to save work entry.",
      })
    }

    const nextDisplayOrder = (latestArtwork?.display_order ?? -1) + 1
    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .insert({
        category: "works",
        year,
        title: normalizedTitle,
        display_order: nextDisplayOrder,
      })
      .select("id, created_at")
      .single()

    if (artworkError || !artwork) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [storagePath],
        logContext: "Work create rollback",
      })
      return createMappedSupabaseErrorResponse({
        message: artworkError?.message || "",
        tableHint: "artworks",
        fallbackMessage: "Unable to save work entry.",
      })
    }

    const { error: artworkImageError } = await supabase
      .from("artwork_images")
      .insert({
        artwork_id: artwork.id,
        storage_path: storagePath,
        caption: normalizedCaption,
        display_order: 0,
        is_primary: true,
      })

    if (artworkImageError) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [storagePath],
        logContext: "Work create image rollback",
      })
      await supabase.from("artworks").delete().eq("id", artwork.id)
      return createMappedSupabaseErrorResponse({
        message: artworkImageError.message,
        tableHint: "artwork_images",
        fallbackMessage: "Unable to save work entry.",
      })
    }

    const additionalImageInsertResult = await insertAdditionalArtworkImages({
      supabase,
      bucketName,
      artworkId: artwork.id,
      caption: normalizedCaption,
      additionalFiles,
      startDisplayOrder: 1,
    })

    if (additionalImageInsertResult.errorMessage) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [storagePath],
        logContext: "Work create additional image rollback",
      })
      await supabase.from("artworks").delete().eq("id", artwork.id)
      return NextResponse.json(
        { error: additionalImageInsertResult.errorMessage },
        { status: 500 },
      )
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "add",
      entityType: "artwork",
      entityId: artwork.id,
      metadata: { category: "works" },
      logContext: "Work create",
    })

    return NextResponse.json({ ok: true, createdAt: artwork.created_at })
  } catch (error) {
    console.error("Work upload failed", { error })
    return NextResponse.json(
      { error: "Server error while uploading work." },
      { status: 500 },
    )
  }
}
