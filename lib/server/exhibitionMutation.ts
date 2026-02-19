import { buildStoragePathWithPrefix } from "@/lib/storage"
import type { ServerSupabaseClient } from "@/lib/server/adminRoute"
import {
  removeStoragePathsSafely,
  uploadStorageFilesWithRollback,
} from "@/lib/server/storageTransaction"

type ExhibitionSnapshot = {
  id: string
  type: string
  title: string
  slug: string
  description: string | null
}

export const rollbackExhibitionUpdate = async (
  supabase: ServerSupabaseClient,
  exhibition: ExhibitionSnapshot,
) => {
  const { error } = await supabase
    .from("exhibitions")
    .update({
      type: exhibition.type,
      title: exhibition.title,
      slug: exhibition.slug,
      description: exhibition.description ?? null,
    })
    .eq("id", exhibition.id)

  if (error) {
    console.error("Exhibition rollback failed", {
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
  }
}

type InsertAdditionalImagesInput = {
  supabase: ServerSupabaseClient
  bucketName: string
  exhibitionId: string
  caption: string
  category: string
  slug: string
  additionalFiles: File[]
  startDisplayOrder: number
}

type InsertAdditionalImagesResult =
  | { errorMessage: null }
  | { errorMessage: string }

export const insertAdditionalExhibitionImages = async ({
  supabase,
  bucketName,
  exhibitionId,
  caption,
  category,
  slug,
  additionalFiles,
  startDisplayOrder,
}: InsertAdditionalImagesInput): Promise<InsertAdditionalImagesResult> => {
  if (additionalFiles.length === 0) {
    return { errorMessage: null }
  }

  const additionalUploadItems = additionalFiles.map((additional, index) => ({
    file: additional,
    storagePath: buildStoragePathWithPrefix({
      prefix: `${category}/${slug}`,
      file: additional,
    }),
    displayOrder: startDisplayOrder + index,
  }))

  const { error: additionalUploadError } = await uploadStorageFilesWithRollback({
    supabase,
    bucketName,
    items: additionalUploadItems.map((item) => ({
      storagePath: item.storagePath,
      file: item.file,
    })),
    logContext: "Exhibition update additional images rollback",
  })

  if (additionalUploadError) {
    return {
      errorMessage: additionalUploadError.message || "Upload failed. Please try again.",
    }
  }

  const inserts = additionalUploadItems.map((item) => ({
    exhibition_id: exhibitionId,
    storage_path: item.storagePath,
    caption,
    display_order: item.displayOrder,
    is_primary: false,
  }))

  const { error: additionalInsertError } = await supabase
    .from("exhibition_images")
    .insert(inserts)

  if (additionalInsertError) {
    await removeStoragePathsSafely({
      supabase,
      bucketName,
      storagePaths: additionalUploadItems.map((item) => item.storagePath),
      logContext: "Exhibition update additional insert rollback",
    })
    return { errorMessage: additionalInsertError.message }
  }

  return { errorMessage: null }
}

type RemoveAdditionalImagesInput = {
  supabase: ServerSupabaseClient
  bucketName: string
  exhibitionId: string
  removedAdditionalImageIds: string[]
}

type RemoveAdditionalImagesResult =
  | { errorMessage: null; status: 200 }
  | { errorMessage: string; status: 400 | 500 }

export const removeAdditionalExhibitionImages = async ({
  supabase,
  bucketName,
  exhibitionId,
  removedAdditionalImageIds,
}: RemoveAdditionalImagesInput): Promise<RemoveAdditionalImagesResult> => {
  if (removedAdditionalImageIds.length === 0) {
    return { errorMessage: null, status: 200 }
  }

  const { data: removableRows, error: removableRowsError } = await supabase
    .from("exhibition_images")
    .select("id, storage_path, is_primary")
    .eq("exhibition_id", exhibitionId)
    .in("id", removedAdditionalImageIds)

  if (removableRowsError) {
    return {
      errorMessage: removableRowsError.message || "Unable to delete images.",
      status: 500,
    }
  }

  if ((removableRows ?? []).some((row) => row.is_primary)) {
    return {
      errorMessage: "Primary image cannot be deleted in this operation.",
      status: 400,
    }
  }

  const removableIds = (removableRows ?? []).map((row) => row.id)
  if (removableIds.length === 0) {
    return { errorMessage: null, status: 200 }
  }

  const { error: removeDbError } = await supabase
    .from("exhibition_images")
    .delete()
    .in("id", removableIds)

  if (removeDbError) {
    return {
      errorMessage: removeDbError.message || "Unable to delete images.",
      status: 500,
    }
  }

  const storagePaths = (removableRows ?? [])
    .map((row) => row.storage_path)
    .filter((value): value is string => Boolean(value))

  await removeStoragePathsSafely({
    supabase,
    bucketName,
    storagePaths,
    logContext: "Exhibition update removed additional cleanup",
  })

  return { errorMessage: null, status: 200 }
}
