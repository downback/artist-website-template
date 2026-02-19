"use client"

import { useEffect, useState } from "react"
import { GripVertical } from "lucide-react"
import ImageCaptionPreview from "@/components/admin/shared/ImageCaptionPreview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type WorkPreviewItem = {
  id: string
  imageUrl: string
  title: string
  caption: string
  year: number | null
  displayOrder: number
  createdAt: string
}

type WorksCardByYearProps = {
  yearLabel: string
  items: WorkPreviewItem[]
  onAdd: () => void
  onEdit: (item: WorkPreviewItem) => void
  onDelete: (item: WorkPreviewItem) => Promise<void>
  onReorder?: (items: WorkPreviewItem[]) => void
}

export default function WorksCardByYear({
  yearLabel,
  items,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: WorksCardByYearProps) {
  const [orderedItems, setOrderedItems] = useState(items)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    setOrderedItems(items)
  }, [items])

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const nextItems = [...orderedItems]
    const [moved] = nextItems.splice(fromIndex, 1)
    nextItems.splice(toIndex, 0, moved)
    setOrderedItems(nextItems)
    onReorder?.(nextItems)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{yearLabel}</CardTitle>
        <Button type="button" variant="highlight" onClick={onAdd}>
          <span className="hidden md:inline">Add</span>
          <span className="md:hidden">Add</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {orderedItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">No work previews yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orderedItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-3  pb-2 last:border-b-0 last:pb-0 ${
                  dragOverIndex === index ? "bg-muted/40" : ""
                }`}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOverIndex(index)
                }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={() => {
                  if (draggedIndex !== null) {
                    moveItem(draggedIndex, index)
                  }
                  setDraggedIndex(null)
                  setDragOverIndex(null)
                }}
              >
                <div className="flex items-center text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <ImageCaptionPreview
                    imageUrl={item.imageUrl}
                    title={item.title}
                    caption={item.caption}
                    onEdit={() => onEdit(item)}
                    onDelete={() => onDelete(item)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {orderedItems.length > 0 ? (
          <p className="text-xs text-left text-muted-foreground">
            Drag rows to reorder
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
