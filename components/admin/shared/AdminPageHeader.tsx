"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

type PageConfig = {
  title: string
  description: string
  viewLink: string
}

const pageConfigs: Record<string, PageConfig> = {
  "/admin": {
    title: "Dashboard",
    description:
      "포트폴리오 웹사이트에 새로운 이미지 | 텍스트를 추가하거나 수정하실 수 있는 관리자 페이지입니다",
    viewLink: "/",
  },
  "/admin/works": {
    title: "Works",
    description:
      "Works page에 새로운 작품을 추가하거나 수정, 삭제하실 수 있습니다",
    viewLink: "/works",
  },
  "/admin/exhibitions": {
    title: "Exhibitions",
    description:
      "Exhibitions page에 새로운 전시 정보를 추가하거나 수정, 삭제하실 수 있습니다",
    viewLink: "/",
  },
  "/admin/cv": {
    title: "CV",
    description:
      "CV page에 새로운 이력을 추가하거나 수정, 삭제하실 수 있습니다",
    viewLink: "/cv",
  },
  "/admin/text": {
    title: "Text",
    description:
      "Texts page에 새로운 텍스트를 추가하거나 수정, 삭제하실 수 있습니다",
    viewLink: "/texts",
  },
}

export default function AdminPageHeader() {
  const pathname = usePathname()
  const config = pageConfigs[pathname] || pageConfigs["/admin"]

  return (
    <div className="flex items-end justify-between gap-4 pb-6 border-b border-border h-20">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{config.title}</h1>
        <p className="text-sm md:text-[13px] text-muted-foreground">
          {config.description}
        </p>
      </div>
      <Link href={config.viewLink} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="gap-2">
          <ExternalLink className="h-4 w-4" />
          View Site
        </Button>
      </Link>
    </div>
  )
}
