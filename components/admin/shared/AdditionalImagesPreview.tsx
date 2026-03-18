"use client"

import Image from "next/image"
import { X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

type AdditionalImagesPreviewProps = {
  existingAdditionalImages: { id: string; url: string; caption?: string }[]
  additionalPreviewUrls?: string[]
  additionalPreviewItems?: { url: string; caption?: string }[]
  onRemoveExistingAdditionalImage: (id: string) => void
  onRemoveAdditionalPreviewImage: (index: number) => void
  onExistingCaptionChange?: (id: string, caption: string) => void
  onAdditionalCaptionChange?: (index: number, caption: string) => void
  captionPlaceholder?: string
}

export default function AdditionalImagesPreview({
  existingAdditionalImages,
  additionalPreviewUrls,
  additionalPreviewItems,
  onRemoveExistingAdditionalImage,
  onRemoveAdditionalPreviewImage,
  onExistingCaptionChange,
  onAdditionalCaptionChange,
  captionPlaceholder = "Optional caption",
}: AdditionalImagesPreviewProps) {
  const normalizedAdditionalPreviewItems: { url: string; caption?: string }[] =
    additionalPreviewItems ?? additionalPreviewUrls?.map((url) => ({ url })) ?? []

  if (
    existingAdditionalImages.length === 0 &&
    normalizedAdditionalPreviewItems.length === 0
  ) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {existingAdditionalImages.map((item, index) => (
        <div
          key={`${item.url}-existing-${index}`}
          className="relative w-full rounded-md border border-border p-2"
        >
          <div className="flex gap-2">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
              <Image
                src={item.url}
                alt={`Additional image ${index + 1}`}
                width={48}
                height={48}
                className="h-full w-full overflow-hidden rounded-md object-cover"
                unoptimized
              />
            </div>
            {onExistingCaptionChange ? (
              <Textarea
                value={item.caption ?? ""}
                onChange={(event) =>
                  onExistingCaptionChange(item.id, event.target.value)
                }
                placeholder={captionPlaceholder}
                className="min-h-[48px] text-xs"
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onRemoveExistingAdditionalImage(item.id)}
            className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-[10px] leading-none text-red-400 shadow"
            aria-label={`Remove additional image ${index + 1}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {normalizedAdditionalPreviewItems.map((item, index) => (
        <div
          key={`${item.url}-${index}`}
          className="relative w-full rounded-md border border-border p-2"
        >
          <div className="flex gap-2">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
              <Image
                src={item.url}
                alt={`Additional preview ${index + 1}`}
                width={48}
                height={48}
                className="h-full w-full rounded-md object-cover"
                unoptimized
              />
            </div>
            {onAdditionalCaptionChange ? (
              <Textarea
                value={item.caption ?? ""}
                onChange={(event) =>
                  onAdditionalCaptionChange(index, event.target.value)
                }
                placeholder={captionPlaceholder}
                className="min-h-[48px] text-xs"
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onRemoveAdditionalPreviewImage(index)}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-[10px] leading-none text-red-400 shadow"
            aria-label={`Remove additional image ${index + 1}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
