"use client"

import { GripVertical } from "lucide-react"
import type { DragEvent } from "react"
import type { ExhibitionCategory } from "@/components/admin/exhibition/ExhibitionUploadModal"
import type { ExhibitionPreviewItem } from "@/components/admin/exhibition/types"
import ImageCaptionPreview from "@/components/admin/shared/ImageCaptionPreview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ExhibitionCardByCategoryProps = {
  title: string
  category: ExhibitionCategory
  items: ExhibitionPreviewItem[]
  dragOverIndex: number | null
  dragCategory: ExhibitionCategory | null
  onAdd: (category: ExhibitionCategory) => void
  onEdit: (item: ExhibitionPreviewItem) => void
  onDelete: (item: ExhibitionPreviewItem) => Promise<void>
  onDragStart: (category: ExhibitionCategory, index: number) => void
  onDragOver: (
    category: ExhibitionCategory,
    index: number,
    event: DragEvent,
  ) => void
  onDragLeave: () => void
  onDrop: (category: ExhibitionCategory, index: number) => void
}

export default function ExhibitionCardByCategory({
  title,
  category,
  items,
  dragOverIndex,
  dragCategory,
  onAdd,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: ExhibitionCardByCategoryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button
          type="button"
          variant="highlight"
          onClick={() => onAdd(category)}
        >
          <span className="hidden md:inline">Add</span>
          <span className="md:hidden">Add</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No exhibition previews yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 pb-2 ${
                  dragCategory === category && dragOverIndex === index
                    ? "bg-muted/40"
                    : ""
                }`}
                draggable
                onDragStart={() => onDragStart(category, index)}
                onDragOver={(event) => onDragOver(category, index, event)}
                onDragLeave={onDragLeave}
                onDrop={() => onDrop(category, index)}
              >
                <div className="flex items-center text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <ImageCaptionPreview
                    imageUrl={item.imageUrl}
                    title={item.exhibitionTitle}
                    caption={item.caption}
                    onEdit={() => {
                      onEdit(item)
                    }}
                    onDelete={() => onDelete(item)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {items.length > 0 ? (
          <p className="text-xs text-left text-muted-foreground">
            Drag rows to reorder
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
