"use client"

import { ChevronRight } from "lucide-react"

type SubHeaderSegment = {
  label: string
  value?: string
}

type DetailSubHeaderProps = {
  segments: SubHeaderSegment[]
}

export default function DetailSubHeader({ segments }: DetailSubHeaderProps) {
  return (
    <div className=" text-sm block md:hidden">
      {segments.map((segment, index) => (
        <span key={`${segment.label}-${segment.value ?? "label"}-${index}`}>
          <span className="">{segment.label}</span>
          {segment.value ? (
            <>
              <ChevronRight className="mx-1 inline-block h-3 w-3" />
              <span className="capitalize">{segment.value}</span>
            </>
          ) : null}
          {index < segments.length - 1 ? <span> | </span> : null}
        </span>
      ))}
    </div>
  )
}
