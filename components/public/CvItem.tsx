"use client"

type CvItemProps = {
  description: string
}

export default function CvItem({ description }: CvItemProps) {
  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-start">
      <div className="text-sm font-light">{description}</div>
    </div>
  )
}
