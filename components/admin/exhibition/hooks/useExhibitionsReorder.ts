"use client"

import { useCallback, useState } from "react"
import type { Dispatch, DragEvent, SetStateAction } from "react"
import type { ExhibitionCategory } from "@/components/admin/exhibition/ExhibitionUploadModal"
import type { ExhibitionPreviewItem } from "@/components/admin/exhibition/types"

type UseExhibitionsReorderInput = {
  previewItems: ExhibitionPreviewItem[]
  setPreviewItems: Dispatch<SetStateAction<ExhibitionPreviewItem[]>>
  setErrorMessage: Dispatch<SetStateAction<string>>
  loadPreviewItems: () => Promise<boolean>
}

export const useExhibitionsReorder = ({
  previewItems,
  setPreviewItems,
  setErrorMessage,
  loadPreviewItems,
}: UseExhibitionsReorderInput) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragCategory, setDragCategory] = useState<ExhibitionCategory | null>(null)

  const persistReorder = useCallback(
    async (
      category: ExhibitionCategory,
      orderedItems: ExhibitionPreviewItem[],
    ) => {
      try {
        const response = await fetch("/api/admin/exhibitions/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            orderedExhibitionIds: orderedItems.map((item) => item.exhibitionId),
          }),
        })
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string }
          throw new Error(payload.error || "Unable to reorder exhibitions.")
        }
      } catch (error) {
        console.error("Failed to persist exhibition order", { error })
        setErrorMessage("Unable to save the exhibition order. Please try again.")
        void loadPreviewItems()
      }
    },
    [loadPreviewItems, setErrorMessage],
  )

  const moveItem = useCallback(
    (category: ExhibitionCategory, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return
      const solo = previewItems.filter(
        (item) => item.category === "solo-exhibitions",
      )
      const group = previewItems.filter(
        (item) => item.category === "group-exhibitions",
      )
      const target = category === "solo-exhibitions" ? solo : group
      const nextTarget = [...target]
      const [moved] = nextTarget.splice(fromIndex, 1)
      nextTarget.splice(toIndex, 0, moved)
      const nextTargetWithOrder = nextTarget.map((item, index) => ({
        ...item,
        exhibitionOrder: index,
      }))
      const nextItems =
        category === "solo-exhibitions"
          ? [...nextTargetWithOrder, ...group]
          : [...solo, ...nextTargetWithOrder]
      setPreviewItems(nextItems)
      void persistReorder(category, nextTargetWithOrder)
    },
    [persistReorder, previewItems, setPreviewItems],
  )

  const handleDragStart = useCallback(
    (category: ExhibitionCategory, index: number) => {
      setDraggedIndex(index)
      setDragCategory(category)
    },
    [],
  )

  const handleDragOver = useCallback(
    (category: ExhibitionCategory, index: number, event: DragEvent) => {
      if (dragCategory && dragCategory !== category) return
      event.preventDefault()
      setDragOverIndex(index)
    },
    [dragCategory],
  )

  const handleDrop = useCallback(
    (category: ExhibitionCategory, index: number) => {
      if (draggedIndex !== null && (!dragCategory || dragCategory === category)) {
        moveItem(category, draggedIndex, index)
      }
      setDraggedIndex(null)
      setDragOverIndex(null)
      setDragCategory(null)
    },
    [dragCategory, draggedIndex, moveItem],
  )

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  return {
    draggedIndex,
    dragOverIndex,
    dragCategory,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragLeave,
  }
}
