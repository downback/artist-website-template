"use client"

import { useState } from "react"
import { ChevronUp, Plus } from "lucide-react"

type TextItemProps = {
  year: string
  title: string
  body: string
  defaultOpen?: boolean
}

export default function TextItem({
  year,
  title,
  body,
  defaultOpen = false,
}: TextItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="w-full border-b-[0.9px] border-black py-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-baseline gap-4 flex-1 min-w-0">
          <span className="text-sm font-light w-16 sm:w-32 shrink-0">{year}</span>
          <span className="text-sm font-light truncate">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-6 w-6" strokeWidth={1} aria-hidden />
        ) : (
          <Plus className="h-6 w-6" strokeWidth={1} aria-hidden />
        )}
      </button>
      {isOpen ? (
        <div className="mt-6 text-[14px] pb-6 whitespace-pre-wrap">{body}</div>
      ) : null}
    </div>
  )
}
