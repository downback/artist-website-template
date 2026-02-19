"use client"

import CvItem from "@/components/public/CvItem"

type CvEntry = {
  id: string
  category: string
  description: string
  description_kr: string
}

type CvListProps = {
  items?: CvEntry[]
  category?: string
  descriptionKey?: "description" | "description_kr"
}

export default function CvList({
  items = [],
  category,
  descriptionKey = "description",
}: CvListProps) {
  return (
    <div className="w-full flex flex-col md:flex-row gap-2 md:gap-8">
      <div className="text-sm font-medium md:font-light min-w-48 text-left md:text-right">
        {category}
      </div>
      <div className="flex flex-col">
        {items.map((item) => (
          <CvItem key={item.id} description={item[descriptionKey] ?? ""} />
        ))}
      </div>
    </div>
  )
}
