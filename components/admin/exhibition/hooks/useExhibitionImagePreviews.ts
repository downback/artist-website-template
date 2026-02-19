"use client"

import { useCallback, useEffect, useState } from "react"
import { formatFileSize, maxImageFileSizeBytes } from "@/lib/fileUpload"

export const useExhibitionImagePreviews = () => {
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState("")
  const [additionalPreviewUrls, setAdditionalPreviewUrls] = useState<string[]>(
    [],
  )

  const setMainPreviewFromFile = useCallback((file: File) => {
    setMainImagePreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return URL.createObjectURL(file)
    })
  }, [])

  const appendAdditionalPreviews = useCallback((files: File[]) => {
    const nextPreviews = files.map((file) => URL.createObjectURL(file))
    setAdditionalPreviewUrls((previousUrls) => [...previousUrls, ...nextPreviews])
  }, [])

  const removeAdditionalPreviewAt = useCallback((indexToRemove: number) => {
    setAdditionalPreviewUrls((previousUrls) => {
      const nextUrls = previousUrls.filter((_, index) => index !== indexToRemove)
      const removedUrl = previousUrls[indexToRemove]
      if (removedUrl) {
        URL.revokeObjectURL(removedUrl)
      }
      return nextUrls
    })
  }, [])

  const clearPreviews = useCallback(() => {
    setMainImagePreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return ""
    })
    setAdditionalPreviewUrls((previousUrls) => {
      previousUrls.forEach((url) => URL.revokeObjectURL(url))
      return []
    })
  }, [])

  useEffect(() => {
    return () => {
      clearPreviews()
    }
  }, [clearPreviews])

  return {
    maxFileSizeBytes: maxImageFileSizeBytes,
    formatFileSize,
    mainImagePreviewUrl,
    additionalPreviewUrls,
    setMainPreviewFromFile,
    appendAdditionalPreviews,
    removeAdditionalPreviewAt,
    clearPreviews,
  }
}
