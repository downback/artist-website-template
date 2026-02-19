import type { ServerSupabaseClient } from "@/lib/server/adminRoute"

type UploadStorageFileInput = {
  supabase: ServerSupabaseClient
  bucketName: string
  storagePath: string
  file: File
}

export const uploadStorageFile = async ({
  supabase,
  bucketName,
  storagePath,
  file,
}: UploadStorageFileInput) => {
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

  return { error }
}

type RemoveStoragePathsInput = {
  supabase: ServerSupabaseClient
  bucketName: string
  storagePaths: string[]
  logContext: string
}

export const removeStoragePathsSafely = async ({
  supabase,
  bucketName,
  storagePaths,
  logContext,
}: RemoveStoragePathsInput) => {
  if (storagePaths.length === 0) {
    return
  }

  const { error } = await supabase.storage.from(bucketName).remove(storagePaths)
  if (error) {
    console.warn(`${logContext} storage cleanup failed`, {
      message: error.message,
      storagePaths,
    })
  }
}

type UploadWithRollbackItem = {
  storagePath: string
  file: File
}

type UploadWithRollbackInput = {
  supabase: ServerSupabaseClient
  bucketName: string
  items: UploadWithRollbackItem[]
  logContext: string
}

export const uploadStorageFilesWithRollback = async ({
  supabase,
  bucketName,
  items,
  logContext,
}: UploadWithRollbackInput) => {
  const uploadedPaths: string[] = []
  for (const item of items) {
    const { error } = await uploadStorageFile({
      supabase,
      bucketName,
      storagePath: item.storagePath,
      file: item.file,
    })
    if (error) {
      await removeStoragePathsSafely({
        supabase,
        bucketName,
        storagePaths: uploadedPaths,
        logContext,
      })
      return { uploadedPaths, error }
    }
    uploadedPaths.push(item.storagePath)
  }

  return { uploadedPaths, error: null }
}
