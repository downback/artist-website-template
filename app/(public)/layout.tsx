import type { ReactNode } from "react"
import SidebarNavDesktop from "@/components/public/shared/SidebarNavDesktop"
import SidebarNavMobile from "@/components/public/shared/SidebarNavMobile"
import { supabaseServer } from "@/lib/server"

const navLinks = [
  { href: "/works", label: "works" },
  { href: "/texts", label: "text" },
  { href: "/cv", label: "cv" },
]

const normalizeTitle = (value?: string | null) => (value ?? "").trim()
const normalizeSlug = (value?: string | null) => (value ?? "").trim()

export default async function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await supabaseServer()
  const [
    { data: worksRows, error: worksError },
    { data: soloRows, error: soloError },
    { data: groupRows, error: groupError },
  ] = await Promise.all([
    supabase
      .from("artworks")
      .select("year")
      .eq("category", "works")
      .not("year", "is", null)
      .order("year", { ascending: false }),
    supabase
      .from("exhibitions")
      .select("title, slug")
      .eq("type", "solo")
      .order("display_order", { ascending: true }),
    supabase
      .from("exhibitions")
      .select("title, slug")
      .eq("type", "group")
      .order("display_order", { ascending: true }),
  ])

  if (worksError || soloError || groupError) {
    console.error("Failed to load sidebar navigation data", {
      worksError,
      soloError,
      groupError,
    })
  }

  const worksYears = Array.from(
    new Set(
      (worksRows ?? [])
        .map((row) => (row.year ? String(row.year) : ""))
        .filter((year) => year.length > 0),
    ),
  )

  const buildExhibitions = (
    rows: { title?: string | null; slug?: string | null }[],
  ) => {
    const seen = new Set<string>()
    return rows
      .map((row) => ({
        title: normalizeTitle(row.title),
        slug: normalizeSlug(row.slug),
      }))
      .filter((row) => row.title.length > 0 && row.slug.length > 0)
      .filter((row) => {
        if (seen.has(row.slug)) return false
        seen.add(row.slug)
        return true
      })
      .map((row) => ({
        slug: row.slug,
        title: row.title,
      }))
  }

  const soloExhibitions = buildExhibitions(soloRows ?? [])
  const groupExhibitions = buildExhibitions(groupRows ?? [])
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="flex w-full flex-col md:sticky md:top-0 md:h-screen md:w-xs xl:w-sm md:shrink-0 md:overflow-y-auto">
        <SidebarNavDesktop
          worksYears={worksYears}
          soloExhibitions={soloExhibitions}
          groupExhibitions={groupExhibitions}
          navLinks={navLinks}
        />
        <SidebarNavMobile
          worksYears={worksYears}
          soloExhibitions={soloExhibitions}
          groupExhibitions={groupExhibitions}
          navLinks={navLinks}
        />
      </div>
      <main className="flex-auto md:w-auto">
        <div className="px-6 mb-32  md:py-0 md:mt-28 md:pr-8">{children}</div>
      </main>
    </div>
  )
}
