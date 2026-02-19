"use client"

import { useCallback } from "react"
import type { ChangeEvent, DragEvent } from "react"

type FileSource = "drop" | "input"

type UseSingleImageInputOptions = {
  maxFileSizeBytes: number
  onFileAccepted: (file: File, source: FileSource) => void
  onFileOversize: (file: File, source: FileSource) => void
}

export const useSingleImageInput = ({
  maxFileSizeBytes,
  onFileAccepted,
  onFileOversize,
}: UseSingleImageInputOptions) => {
  const processFile = useCallback(
    (file: File | null, source: FileSource) => {
      if (!file) return
      if (file.size > maxFileSizeBytes) {
        onFileOversize(file, source)
        return
      }
      onFileAccepted(file, source)
    },
    [maxFileSizeBytes, onFileAccepted, onFileOversize],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      const file = event.dataTransfer.files?.[0] ?? null
      processFile(file, "drop")
    },
    [processFile],
  )

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null
      processFile(file, "input")
      if (!file || file.size > maxFileSizeBytes) {
        event.target.value = ""
      }
    },
    [maxFileSizeBytes, processFile],
  )

  return {
    handleDragOver,
    handleDrop,
    handleInputChange,
  }
}
