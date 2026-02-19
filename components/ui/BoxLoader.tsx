import { LoaderCircle } from "lucide-react"

type LoaderProps = {
  boxSize?: "md" | "lg"
  size?: "sm" | "md" | "lg"
  background?: boolean
  className?: string
}

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-10 w-10",
}

const boxSizeClasses = {
  md: "w-full",
  lg: "w-1/2",
}

export default function BoxLoader({
  boxSize = "md",
  size = "md",
  background = true,
  className = "",
}: LoaderProps) {
  const iconClasses = iconSizeClasses[size]
  const widthClass = boxSizeClasses[boxSize]
  const bgClass = background ? "animate-pulse bg-gray-200/50" : ""
  const centerClass = boxSize === "lg" ? "mx-auto" : ""

  return (
    <div
      className={`flex items-center justify-center h-full ${widthClass} ${centerClass} ${bgClass} ${className}`}
    >
      <LoaderCircle
        className={`${iconClasses} text-black/50 animate-spin`}
        strokeWidth={0.8}
      />
    </div>
  )
}
