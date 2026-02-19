import Link from "next/link"
import { ArrowRight } from "lucide-react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabaseServer } from "@/lib/server"

type PreviewCard = {
  title: "Works" | "CV" | "Exhibitions" | "Texts"
  updatedAt: string
  adminLink: string
  count?: number | null
}

const formatUpdatedAt = (value?: string | null) => {
  if (!value) return "Not updated"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

const getLatestTimestamp = (timestamps: (string | null | undefined)[]) => {
  const numericTimes = timestamps
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))

  if (numericTimes.length === 0) return null
  return new Date(Math.max(...numericTimes)).toISOString()
}

export default async function AdminQuickPreviewPanel() {
  const supabase = await supabaseServer()

  const [
    worksResult,
    soloResult,
    groupResult,
    educationResult,
    residencyResult,
    awardsResult,
    collectionsResult,
    exhibitionsResult,
    textsResult,
    worksCountResult,
    exhibitionsCountResult,
    textsCountResult,
  ] = await Promise.all([
    supabase
      .from("artworks")
      .select("updated_at")
      .eq("category", "works")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bio_solo_exhibitions")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bio_group_exhibitions")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bio_education")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bio_residency")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bio_awards")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bio_collections")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("exhibitions")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("texts")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("artworks")
      .select("id", { count: "exact", head: true })
      .eq("category", "works"),
    supabase.from("exhibitions").select("id", { count: "exact", head: true }),
    supabase.from("texts").select("id", { count: "exact", head: true }),
  ])

  const biographyUpdatedAt = getLatestTimestamp([
    soloResult.data?.created_at,
    groupResult.data?.created_at,
    educationResult.data?.created_at,
    residencyResult.data?.created_at,
    awardsResult.data?.created_at,
    collectionsResult.data?.created_at,
  ])

  const exhibitionsUpdatedAt = exhibitionsResult.data?.updated_at ?? null
  const textsUpdatedAt = textsResult.data?.updated_at ?? null

  const previewCards: PreviewCard[] = [
    {
      title: "Works",
      updatedAt: formatUpdatedAt(worksResult.data?.updated_at),
      adminLink: "/admin/works",
      count: worksCountResult.count ?? 0,
    },
    {
      title: "Exhibitions",
      updatedAt: formatUpdatedAt(exhibitionsUpdatedAt),
      adminLink: "/admin/exhibitions",
      count: exhibitionsCountResult.count ?? 0,
    },
    {
      title: "Texts",
      updatedAt: formatUpdatedAt(textsUpdatedAt),
      adminLink: "/admin/text",
      count: textsCountResult.count ?? 0,
    },
    {
      title: "CV",
      updatedAt: formatUpdatedAt(biographyUpdatedAt),
      adminLink: "/admin/cv",
    },
  ]

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Preview & Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {previewCards.map((card) => (
          <Card
            key={card.title}
            className="h-full flex flex-col justify-between"
          >
            <CardHeader className="p-4 h-auto">
              <div className="flex items-center justify-between h-full">
                <CardTitle className="text-base">{card.title}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  Last update: {card.updatedAt}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 ">
              {card.count !== undefined ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground ">
                  <span className="">총</span>
                  <span className="text-2xl font-bold">{card.count}</span>
                  <span>{card.title.toLowerCase()} 등록됨</span>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="mt-auto flex justify-end p-0">
              <Button asChild variant="default" size="sm" aria-label="Open">
                <Link href={card.adminLink}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}
