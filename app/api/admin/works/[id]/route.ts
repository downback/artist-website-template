import { NextResponse } from "next/server"
import { siteAssetsBucketName } from "@/lib/constants"
import {
  validateWorkMetadata,
  type WorkMetadataValidationData,
} from "@/lib/requestValidation"
import { buildStoragePathWithPrefix } from "@/lib/storage"
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

    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle()

    if (artworkError || !artwork?.storage_path) {
      return NextResponse.json({ error: "Work not found." }, { status: 404 })
    }

    let nextStoragePath = artwork.storage_path
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
        storage_path: nextStoragePath,
        year,
        title: normalizedTitle,
        caption: normalizedCaption,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, created_at, storage_path")
      .single()

    if (updateError || !updated) {
      if (nextStoragePath !== artwork.storage_path) {
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

    if (nextStoragePath !== artwork.storage_path) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: [artwork.storage_path],
        logContext: "Work update old-file cleanup",
      })
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
      .select("storage_path")
      .eq("id", id)
      .maybeSingle()

    if (artworkError || !artwork?.storage_path) {
      return NextResponse.json({ error: "Work not found." }, { status: 404 })
    }

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
      storagePaths: [artwork.storage_path],
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
