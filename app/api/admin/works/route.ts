import { NextResponse } from "next/server"
import { siteAssetsBucketName } from "@/lib/constants"
import { buildStoragePathWithPrefix } from "@/lib/storage"
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
        storage_path: storagePath,
        category: "works",
        year,
        title: normalizedTitle,
        caption: normalizedCaption,
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
