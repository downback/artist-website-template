"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePreviewUrlRegistry } from "@/components/admin/shared/hooks/usePreviewUrlRegistry"
import type {
  ExhibitionCategory,
  ExhibitionFormValues,
} from "@/components/admin/exhibition/ExhibitionUploadModal"
import type { ExhibitionPreviewItem } from "@/components/admin/exhibition/types"
import { siteAssetsBucketName } from "@/lib/constants"
import { supabaseBrowser } from "@/lib/client"

const bucketName = siteAssetsBucketName

export const useExhibitionsPanelData = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [previewItems, setPreviewItems] = useState<ExhibitionPreviewItem[]>([])
  const [editingItem, setEditingItem] = useState<ExhibitionPreviewItem | null>(
    null,
  )
  const [editingAdditionalImages, setEditingAdditionalImages] = useState<
    { id: string; url: string }[]
  >([])
  const [resetSignal, setResetSignal] = useState(0)
  const [selectedCategory, setSelectedCategory] =
    useState<ExhibitionCategory>("solo-exhibitions")
  const { registerPreviewUrl, revokeRegisteredPreviewUrls } =
    usePreviewUrlRegistry()
  const supabase = useMemo(() => supabaseBrowser(), [])

  const loadPreviewItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("exhibition_images")
      .select(
        "id, storage_path, caption, display_order, created_at, is_primary, exhibitions ( id, title, type, slug, display_order, description )",
      )

    if (error) {
      console.error("Failed to load exhibition previews", { error })
      return false
    }

    const nextItems = (data ?? [])
      .filter((item) => item.is_primary)
      .map((item) => {
        if (!item.storage_path) return null
        const exhibition = Array.isArray(item.exhibitions)
          ? item.exhibitions[0]
          : item.exhibitions
        if (!exhibition) return null
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(item.storage_path)
        if (!publicData?.publicUrl) return null
        return {
          id: item.id,
          exhibitionId: exhibition.id,
          imageUrl: publicData.publicUrl,
          caption: item.caption ?? "",
          category:
            exhibition.type === "solo"
              ? "solo-exhibitions"
              : "group-exhibitions",
          description: exhibition.description ?? "",
          exhibitionTitle: exhibition.title ?? "",
          exhibitionOrder: exhibition.display_order ?? 0,
          imageOrder: item.display_order ?? 0,
          createdAt: item.created_at ?? new Date().toISOString(),
        }
      })
      .filter((item): item is ExhibitionPreviewItem => Boolean(item))
      .sort(
        (a, b) =>
          a.exhibitionOrder - b.exhibitionOrder || a.imageOrder - b.imageOrder,
      )

    setPreviewItems(nextItems)
    return true
  }, [supabase])

  useEffect(() => {
    void loadPreviewItems()
  }, [loadPreviewItems])

  const soloItems = useMemo(
    () => previewItems.filter((item) => item.category === "solo-exhibitions"),
    [previewItems],
  )
  const groupItems = useMemo(
    () => previewItems.filter((item) => item.category === "group-exhibitions"),
    [previewItems],
  )

  const modalInitialValues = useMemo(() => {
    if (editingItem) {
      return {
        mainImageUrl: editingItem.imageUrl,
        category: editingItem.category,
        exhibitionTitle: editingItem.exhibitionTitle,
        caption: editingItem.caption,
        description: editingItem.description,
        additionalImages: editingAdditionalImages,
      }
    }
    return {
      category: selectedCategory,
      additionalImages: [],
    }
  }, [editingItem, editingAdditionalImages, selectedCategory])

  const handleSave = useCallback(
    async (values: ExhibitionFormValues) => {
      const isEditMode = Boolean(editingItem)
      if (!values.mainImageFile && !isEditMode) {
        setErrorMessage("Select a main image to upload.")
        return
      }
      if (!values.exhibitionTitle.trim()) {
        setErrorMessage("Exhibition title is required.")
        return
      }
      if (!values.caption.trim()) {
        setErrorMessage("Caption is required.")
        return
      }

      setIsUploading(true)
      setErrorMessage("")
      let shouldRevokePendingUrls = true

      try {
        const previewUrl = values.mainImageFile
          ? URL.createObjectURL(values.mainImageFile)
          : ""
        if (previewUrl) {
          registerPreviewUrl(previewUrl)
        }

        const formData = new FormData()
        if (values.mainImageFile) {
          formData.append("file", values.mainImageFile)
        }
        formData.append("category", values.category)
        formData.append("exhibition_title", values.exhibitionTitle)
        formData.append("caption", values.caption)
        formData.append("description", values.description)
        values.additionalImages.forEach((file) => {
          formData.append("additional_images", file)
        })
        values.removedAdditionalImageIds?.forEach((imageId) => {
          formData.append("removedAdditionalImageIds", imageId)
        })

        const response = await fetch(
          isEditMode
            ? `/api/admin/exhibitions/${editingItem?.id}`
            : "/api/admin/exhibitions",
          {
            method: isEditMode ? "PATCH" : "POST",
            body: formData,
          },
        )

        if (!response.ok) {
          let nextErrorMessage = "Unable to save the exhibition."

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

        if (!isEditMode && previewUrl) {
          setPreviewItems((prev) => [
            {
              id: crypto.randomUUID(),
              exhibitionId: editingItem?.exhibitionId ?? crypto.randomUUID(),
              imageUrl: previewUrl,
              caption: values.caption,
              category: values.category,
              description: values.description,
              exhibitionTitle: values.exhibitionTitle,
              exhibitionOrder: 0,
              imageOrder: 0,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ])
        }

        const didReloadPreviewItems = await loadPreviewItems()
        shouldRevokePendingUrls = didReloadPreviewItems
        setIsUploadOpen(false)
        setEditingItem(null)
        setEditingAdditionalImages([])
        setResetSignal((prev) => prev + 1)
      } catch (error) {
        console.error("Failed to save exhibition entry", { error })
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
          setErrorMessage("Unable to save the exhibition. Please try again.")
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
      registerPreviewUrl,
      revokeRegisteredPreviewUrls,
    ],
  )

  const handleDelete = useCallback(
    async (item: ExhibitionPreviewItem) => {
      try {
        const response = await fetch(`/api/admin/exhibitions/${item.id}`, {
          method: "DELETE",
        })
        const payload = (await response.json()) as { error?: string }
        if (!response.ok) {
          throw new Error(payload.error || "Unable to delete exhibition.")
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await loadPreviewItems()
      } catch (error) {
        console.error("Failed to delete exhibition", { error })
        setErrorMessage("Unable to delete the exhibition. Please try again.")
      }
    },
    [loadPreviewItems],
  )

  const handleEdit = useCallback(
    async (item: ExhibitionPreviewItem) => {
      setEditingItem(item)
      setSelectedCategory(item.category)
      setErrorMessage("")

      const { data, error } = await supabase
        .from("exhibition_images")
        .select("id, storage_path, is_primary, display_order")
        .eq("exhibition_id", item.exhibitionId)
        .order("display_order", { ascending: true })

      if (error) {
        console.error("Failed to load exhibition images", { error })
        setEditingAdditionalImages([])
        setIsUploadOpen(true)
        return
      }

      const additionalImages = (data ?? [])
        .filter((image) => !image.is_primary && image.storage_path)
        .map((image) => {
          const { data: publicData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(image.storage_path)
          return {
            id: image.id,
            url: publicData?.publicUrl ?? "",
          }
        })
        .filter((image) => image.url.length > 0)

      setEditingAdditionalImages(additionalImages)
      setIsUploadOpen(true)
    },
    [supabase],
  )

  const openAddModal = useCallback((category: ExhibitionCategory) => {
    setErrorMessage("")
    setEditingItem(null)
    setEditingAdditionalImages([])
    setSelectedCategory(category)
    setIsUploadOpen(true)
  }, [])

  return {
    isUploadOpen,
    setIsUploadOpen,
    isUploading,
    errorMessage,
    setErrorMessage,
    previewItems,
    setPreviewItems,
    editingItem,
    editingAdditionalImages,
    resetSignal,
    selectedCategory,
    soloItems,
    groupItems,
    modalInitialValues,
    handleSave,
    handleDelete,
    handleEdit,
    loadPreviewItems,
    openAddModal,
  }
}
