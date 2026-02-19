"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import SidebarNavContent from "@/components/public/shared/SidebarNavContent"

type ExhibitionItem = {
  title: string
  slug: string
}

type NavLink = {
  href: string
  label: string
}

type SidebarNavDesktopProps = {
  worksYears: string[]
  soloExhibitions: ExhibitionItem[]
  groupExhibitions: ExhibitionItem[]
  navLinks: NavLink[]
}

export default function SidebarNavDesktop({
  worksYears,
  soloExhibitions,
  groupExhibitions,
  navLinks,
}: SidebarNavDesktopProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-xs xl:w-sm shrink-0 min-h-screen flex-col">
      <div className="px-8 py-8 flex-none">
        <Link href="/" className="text-base font-medium ">
          NARAE WON
        </Link>
      </div>
      <div className="flex-auto overflow-y-auto hide-scrollbar">
        <SidebarNavContent
          worksYears={worksYears}
          soloExhibitions={soloExhibitions}
          groupExhibitions={groupExhibitions}
          navLinks={navLinks}
          pathname={pathname}
          className="px-8 pb-6"
        />
      </div>
    </aside>
  )
}
