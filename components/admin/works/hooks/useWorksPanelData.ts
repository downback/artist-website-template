"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePreviewUrlRegistry } from "@/components/admin/shared/hooks/usePreviewUrlRegistry"
import type { WorkFormValues } from "@/components/admin/works/WorkUploadModal"
import {
  siteAssetsBucketName,
  worksYearRangeEnd,
  worksYearRangeStart,
  worksYearRangeValue,
} from "@/lib/constants"
import { supabaseBrowser } from "@/lib/client"

export type WorkPreviewItem = {
  id: string
  imageUrl: string
  title: string
  caption: string
  year: number | null
  displayOrder: number
  createdAt: string
}

export const useWorksPanelData = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [previewItems, setPreviewItems] = useState<WorkPreviewItem[]>([])
  const [editingItem, setEditingItem] = useState<WorkPreviewItem | null>(null)
  const [manualYears, setManualYears] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedYearCategory, setSelectedYearCategory] = useState<string>("")
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false)
  const { registerPreviewUrl, revokeRegisteredPreviewUrls } =
    usePreviewUrlRegistry()

  const supabase = useMemo(() => supabaseBrowser(), [])
  const bucketName = siteAssetsBucketName
  const rangeLabel = worksYearRangeValue
  const rangeStart = worksYearRangeStart
  const rangeEnd = worksYearRangeEnd

  const loadPreviewItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("artworks")
      .select(
        "id, storage_path, title, caption, year, display_order, created_at",
      )
      .eq("category", "works")
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load work previews", { error })
      return false
    }

    const nextItems = (data ?? [])
      .map((item) => {
        if (!item.storage_path) return null
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(item.storage_path)
        if (!publicData?.publicUrl) return null
        return {
          id: item.id,
          imageUrl: publicData.publicUrl,
          title: item.title ?? "",
          caption: item.caption ?? "",
          year: item.year ?? null,
          displayOrder: item.display_order ?? 0,
          createdAt: item.created_at ?? new Date().toISOString(),
        }
      })
      .filter((item): item is WorkPreviewItem => Boolean(item))

    setPreviewItems(nextItems)
    return true
  }, [bucketName, supabase])

  useEffect(() => {
    void loadPreviewItems()
  }, [loadPreviewItems])

  const handleSave = useCallback(
    async (values: WorkFormValues) => {
      const isEditMode = Boolean(editingItem)
      if (!values.imageFile && !isEditMode) {
        setErrorMessage("Select an image to upload.")
        return
      }
      if (!values.title.trim()) {
        setErrorMessage("Title is required.")
        return
      }
      if (!values.caption.trim()) {
        setErrorMessage("Caption is required.")
        return
      }

      const isYearSelectEnabled = selectedYearCategory === rangeLabel
      let resolvedYear = ""

      if (isYearSelectEnabled) {
        resolvedYear = values.year.trim()
      } else {
        resolvedYear =
          values.year.trim() ||
          (editingItem?.year ? String(editingItem.year) : "") ||
          selectedYear
      }

      if (!resolvedYear) {
        setErrorMessage("Select year is required.")
        return
      }

      setIsUploading(true)
      setErrorMessage("")
      let shouldRevokePendingUrls = true

      try {
        const previewUrl = values.imageFile
          ? URL.createObjectURL(values.imageFile)
          : ""
        const formData = new FormData()
        if (values.imageFile) {
          formData.append("file", values.imageFile)
        }
        formData.append("year", resolvedYear)
        formData.append("title", values.title)
        formData.append("caption", values.caption)

        const response = await fetch(
          isEditMode
            ? `/api/admin/works/${editingItem?.id}`
            : "/api/admin/works",
          {
            method: isEditMode ? "PATCH" : "POST",
            body: formData,
          },
        )

        if (!response.ok) {
          let nextErrorMessage = "Unable to save the work."

          if (response.status === 413) {
            nextErrorMessage =
              "File size is too large. Please reduce the image size and try again."
          } else if (response.status === 415) {
            nextErrorMessage =
              "Unsupported file format. Please use PNG or JPG images."
          } else if (response.status === 401) {
            nextErrorMessage = "Your session has expired. Please sign in again."
          } else if (response.status === 500) {
            nextErrorMessage = "Server error. Please try again later."
          } else if (response.status === 504) {
            nextErrorMessage =
              "Upload timeout. The file may be too large or your connection is slow."
          }

          try {
            const payload = (await response.json()) as { error?: string }
            if (payload.error) {
              nextErrorMessage = payload.error
            }
          } catch {
            // If JSON parsing fails, use the default error message
          }

          throw new Error(nextErrorMessage)
        }

        if (previewUrl) {
          registerPreviewUrl(previewUrl)
        }
        if (!isEditMode && previewUrl) {
          setPreviewItems((prev) => [
            {
              id: crypto.randomUUID(),
              imageUrl: previewUrl,
              title: values.title,
              caption: values.caption,
              year: Number(resolvedYear),
              displayOrder: 0,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ])
        }
        const didReloadPreviewItems = await loadPreviewItems()
        shouldRevokePendingUrls = didReloadPreviewItems
        setIsUploadOpen(false)
        setEditingItem(null)
        setSelectedYear("")
      } catch (error) {
        console.error("Failed to save work entry", { error })
        if (error instanceof Error) {
          if (error.message.includes("fetch failed")) {
            setErrorMessage(
              "Network error. Please check your connection and try again.",
            )
          } else if (error.message.includes("timeout")) {
            setErrorMessage(
              "Request timeout. Please check your connection or try with a smaller file.",
            )
          } else {
            setErrorMessage(error.message)
          }
        } else {
          setErrorMessage("Unable to save the work entry. Please try again.")
        }
      } finally {
        if (shouldRevokePendingUrls) {
          revokeRegisteredPreviewUrls()
        }
        setIsUploading(false)
      }
    },
    [
      editingItem,
      loadPreviewItems,
      rangeLabel,
      registerPreviewUrl,
      revokeRegisteredPreviewUrls,
      selectedYear,
      selectedYearCategory,
    ],
  )

  const modalInitialValues = useMemo(() => {
    if (editingItem) {
      return {
        imageUrl: editingItem.imageUrl,
        year: editingItem.year ? String(editingItem.year) : "",
        title: editingItem.title,
        caption: editingItem.caption,
      }
    }
    if (selectedYear) {
      return { year: selectedYear }
    }
    return undefined
  }, [editingItem, selectedYear])

  const yearOptions = useMemo(() => {
    const yearsFromItems = previewItems
      .map((item) => (item.year ? String(item.year) : null))
      .filter((value): value is string => Boolean(value))
    const filteredYears = yearsFromItems.filter((year) => {
      const numeric = Number(year)
      return Number.isNaN(numeric) || numeric < rangeStart || numeric > rangeEnd
    })
    const filteredManualYears = manualYears.filter((year) => {
      const numeric = Number(year)
      return Number.isNaN(numeric) || numeric < rangeStart || numeric > rangeEnd
    })
    const merged = Array.from(
      new Set([rangeLabel, ...filteredYears, ...filteredManualYears]),
    )
    const sortValue = (label: string) => {
      if (label === rangeLabel) return rangeEnd
      const numeric = Number(label)
      return Number.isNaN(numeric) ? Number.NEGATIVE_INFINITY : numeric
    }
    return merged.sort((a, b) => sortValue(b) - sortValue(a))
  }, [manualYears, previewItems, rangeEnd, rangeLabel, rangeStart])

  const yearSelectOptions = useMemo(
    () =>
      Array.from({ length: rangeEnd - rangeStart + 1 }, (_, index) =>
        String(rangeStart + index),
      ),
    [rangeEnd, rangeStart],
  )

  const groupedByYear = useMemo(() => {
    const grouped = new Map<string, WorkPreviewItem[]>()
    yearOptions.forEach((year) => grouped.set(year, []))
    previewItems.forEach((item) => {
      const numericYear = item.year ?? null
      if (numericYear && numericYear >= rangeStart && numericYear <= rangeEnd) {
        grouped.get(rangeLabel)?.push(item)
        return
      }
      const year = numericYear ? String(numericYear) : "Unknown"
      if (!grouped.has(year)) grouped.set(year, [])
      grouped.get(year)?.push(item)
    })
    grouped.forEach((items, year) => {
      items.sort(
        (a, b) =>
          b.displayOrder - a.displayOrder ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      grouped.set(year, items)
    })
    return grouped
  }, [previewItems, rangeEnd, rangeLabel, rangeStart, yearOptions])

  const handleAdd = useCallback(
    (year: string) => {
      setErrorMessage("")
      setEditingItem(null)
      setSelectedYear(year === rangeLabel ? String(rangeEnd) : year)
      setSelectedYearCategory(year)
      setIsUploadOpen(true)
    },
    [rangeEnd, rangeLabel],
  )

  const handleEdit = useCallback(
    (item: WorkPreviewItem) => {
      setEditingItem(item)
      const nextYear = item.year ? String(item.year) : ""
      const nextCategory =
        item.year && item.year >= rangeStart && item.year <= rangeEnd
          ? rangeLabel
          : nextYear
      setSelectedYear(nextYear)
      setSelectedYearCategory(nextCategory)
      setErrorMessage("")
      setIsUploadOpen(true)
    },
    [rangeEnd, rangeLabel, rangeStart],
  )

  const handleDelete = useCallback(
    async (item: WorkPreviewItem) => {
      try {
        const response = await fetch(`/api/admin/works/${item.id}`, {
          method: "DELETE",
        })
        const payload = (await response.json()) as { error?: string }
        if (!response.ok) {
          throw new Error(payload.error || "Unable to delete work.")
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await loadPreviewItems()
      } catch (error) {
        console.error("Failed to delete work", { error })
        setErrorMessage("Unable to delete the work entry. Please try again.")
      }
    },
    [loadPreviewItems],
  )

  const handleReorder = useCallback(
    async (yearLabel: string, orderedItems: WorkPreviewItem[]) => {
      const nextOrderMap = new Map(
        orderedItems.map((item, index) => [
          item.id,
          orderedItems.length - index,
        ]),
      )
      setPreviewItems((prev) =>
        prev.map((item) =>
          nextOrderMap.has(item.id)
            ? { ...item, displayOrder: nextOrderMap.get(item.id) ?? 0 }
            : item,
        ),
      )

      try {
        const response = await fetch("/api/admin/works/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            yearLabel,
            orderedWorkIds: orderedItems.map((item) => item.id),
          }),
        })
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string }
          throw new Error(payload.error || "Unable to reorder works.")
        }
      } catch (error) {
        console.error("Failed to persist works order", { error })
        setErrorMessage("Unable to save the work order. Please try again.")
        await loadPreviewItems()
      }
    },
    [loadPreviewItems],
  )

  const handleYearConfirm = useCallback((nextYear: string) => {
    setErrorMessage("")
    setManualYears((prev) =>
      prev.includes(nextYear) ? prev : [...prev, nextYear],
    )
  }, [])

  return {
    isUploadOpen,
    setIsUploadOpen,
    isUploading,
    errorMessage,
    yearOptions,
    groupedByYear,
    yearSelectOptions,
    selectedYearCategory,
    rangeLabel,
    editingItem,
    modalInitialValues,
    isYearDialogOpen,
    setIsYearDialogOpen,
    handleSave,
    handleAdd,
    handleEdit,
    handleDelete,
    handleReorder,
    handleYearConfirm,
  }
}
