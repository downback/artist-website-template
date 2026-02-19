"use client"

import { useState } from "react"
import Image from "next/image"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import AdminDialog from "@/components/admin/shared/AdminDialog"

type ImageCaptionPreviewProps = {
  imageUrl: string
  title: string
  caption: string
  onEdit?: () => void
  onDelete?: () => Promise<void> | void
}

export default function ImageCaptionPreview({
  imageUrl,
  title,
  caption,
  onEdit,
  onDelete,
}: ImageCaptionPreviewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    try {
      const startTime = Date.now()
      setIsDialogOpen(true)
      setIsDeleting(true)
      await onDelete()
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 1000) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000 - elapsedTime)
        })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Delete failed", { error })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 aspect-square overflow-hidden rounded-md border border-border bg-muted/20">
          <Image
            src={imageUrl}
            alt={caption}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="text-muted-foreground wrap-break-word flex flex-col gap-1">
          <span className="inline-block text-sm ">{title}</span>
          <span className="inline-block text-xs">{caption}</span>
        </div>
      </div>
      <div className="flex gap-0 md:gap-2 items-center">
        <Button
          type="button"
          variant="default"
          size="icon"
          aria-label="Edit"
          className="shadow-none"
          onClick={onEdit}
          disabled={!onEdit}
        >
          <Pencil
            className="h-4 w-4 text-zinc-600 hover:text-zinc-400"
            strokeWidth={2}
          />
        </Button>
        <AdminDialog
          open={isDialogOpen}
          isLoading={isDeleting}
          onOpenChange={(nextOpen) => {
            if (isDeleting) return
            setIsDialogOpen(nextOpen)
          }}
          onConfirm={handleDelete}
          disabled={!onDelete}
          trigger={
            <Button
              type="button"
              variant="default"
              size="icon"
              aria-label="Delete"
              className="shadow-none"
              disabled={!onDelete}
            >
              <Trash2
                className="h-4 w-4 text-red-500 hover:text-red-300"
                strokeWidth={1.5}
              />
            </Button>
          }
          title="Delete item?"
          description="삭제 후 복구할 수 없습니다. 진행하시겠습니까?"
          confirmLabel="Delete"
          loadingLabel="Deleting..."
          showCancel={true}
          variant="destructive"
        />
      </div>
    </div>
  )
}
