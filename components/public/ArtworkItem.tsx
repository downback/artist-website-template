"use client"

import LightboxImage from "@/components/public/LightboxImage"

type ArtworkItemProps = {
  title?: string
  caption?: string
  imageSrc?: string
  imageAlt?: string
}

const placeholderSrc =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23E5E7EB'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239CA3AF' font-family='Arial, sans-serif' font-size='32'%3EImage placeholder%3C/text%3E%3C/svg%3E"

export default function ArtworkItem({
  title = "Work title",
  caption = "Work caption placeholder text.",
  imageSrc = placeholderSrc,
  imageAlt = "Artwork placeholder",
}: ArtworkItemProps) {
  return (
    <div className="mx-auto w-full md:w-lg xl:max-w-3xl">
      <div className=" w-full ">
        <LightboxImage
          src={imageSrc}
          alt={imageAlt}
          width={1200}
          height={800}
          sizes="(min-width: 768px) 768px, 100vw"
          className="block h-full w-full"
          imageClassName="h-auto w-full object-cover md:h-auto md:w-full"
        />
      </div>
      <div className="px-1 mt-2 md:mt-4 flex md:flex-row flex-col justify-between w-full md:gap-4">
        <p className="md:font-light font-base md:flex-1 text-sm md:text-[13px] whitespace-pre-wrap">
          {title}
        </p>
        <p className="md:flex-1 md:text-right font-light text-xs whitespace-pre-wrap">
          {caption}
        </p>
      </div>
    </div>
  )
}
