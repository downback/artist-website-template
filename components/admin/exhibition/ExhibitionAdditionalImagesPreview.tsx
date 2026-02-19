"use client"

import Image from "next/image"
import { X } from "lucide-react"

type ExhibitionAdditionalImagesPreviewProps = {
  existingAdditionalImages: { id: string; url: string }[]
  additionalPreviewUrls: string[]
  onRemoveExistingAdditionalImage: (id: string) => void
  onRemoveAdditionalPreviewImage: (index: number) => void
}

export default function ExhibitionAdditionalImagesPreview({
  existingAdditionalImages,
  additionalPreviewUrls,
  onRemoveExistingAdditionalImage,
  onRemoveAdditionalPreviewImage,
}: ExhibitionAdditionalImagesPreviewProps) {
  if (existingAdditionalImages.length === 0 && additionalPreviewUrls.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {existingAdditionalImages.map((item, index) => (
        <div
          key={`${item.url}-existing-${index}`}
          className="relative h-12 w-12 rounded-md border border-border"
        >
          <Image
            src={item.url}
            alt={`Additional image ${index + 1}`}
            width={48}
            height={48}
            className="h-full w-full object-cover overflow-hidden rounded-md"
            unoptimized
          />
          <button
            type="button"
            onClick={() => onRemoveExistingAdditionalImage(item.id)}
            className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-[10px] leading-none shadow text-red-400"
            aria-label={`Remove additional image ${index + 1}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {additionalPreviewUrls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="relative h-12 w-12 rounded-md border border-border"
        >
          <Image
            src={url}
            alt={`Additional preview ${index + 1}`}
            width={48}
            height={48}
            className="h-full w-full object-cover rounded-md"
            unoptimized
          />
          <button
            type="button"
            onClick={() => onRemoveAdditionalPreviewImage(index)}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-[10px] leading-none shadow text-red-400"
            aria-label={`Remove additional image ${index + 1}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
