"use client"

import { useCallback, useEffect, useRef } from "react"

export const usePreviewUrlRegistry = () => {
  const previewUrlsRef = useRef<string[]>([])

  const registerPreviewUrl = useCallback((url: string) => {
    if (!url) return
    previewUrlsRef.current.push(url)
  }, [])

  const revokeRegisteredPreviewUrls = useCallback(() => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrlsRef.current = []
  }, [])

  useEffect(() => {
    return () => {
      revokeRegisteredPreviewUrls()
    }
  }, [revokeRegisteredPreviewUrls])

  return {
    registerPreviewUrl,
    revokeRegisteredPreviewUrls,
  }
}
