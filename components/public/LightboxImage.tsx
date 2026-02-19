"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import BoxLoader from "@/components/ui/BoxLoader"

type LightboxImageProps = {
  src: string
  alt: string
  width: number
  height: number
  sizes?: string
  className?: string
  imageClassName?: string
  priority?: boolean
}

export default function LightboxImage({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  imageClassName,
  priority = false,
}: LightboxImageProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalImageLoading, setIsModalImageLoading] = useState(true)

  const handleOpenModal = () => {
    setIsOpen(true)
    setIsModalImageLoading(true)
  }

  return (
    <>
      <button
        type="button"
        className={`relative ${className}`}
        onClick={handleOpenModal}
        aria-label="Open image preview"
      >
        {isLoading && (
          <div className="absolute inset-0 z-10">
            <BoxLoader boxSize="md" size="md" />
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          className={imageClassName}
          onLoad={() => setIsLoading(false)}
        />
      </button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[85vh] md:max-h-[95vh] border-none bg-transparent p-0 shadow-none"
          hideCloseButton
          onClick={() => setIsOpen(false)}
        >
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          <div className="relative h-full w-full">
            {isModalImageLoading && <BoxLoader boxSize="lg" size="lg" />}
            <Image
              src={src}
              alt={alt}
              fill
              sizes="95vw"
              className="object-contain"
              priority
              onLoad={() => setIsModalImageLoading(false)}
            />
            <div className="hidden md:block md:absolute right-3 -top-2 z-20">
              <Button
                type="button"
                variant="svg"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className="absolute md:hidden right-0 top-0 z-20">
              <Button
                type="button"
                variant="svg"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
