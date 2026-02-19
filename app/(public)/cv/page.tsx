import Link from "next/link"
import { Instagram } from "lucide-react"
import DetailSubHeader from "@/components/public/shared/DetailSubHeader"
import { supabaseServer } from "@/lib/server"
import CvList from "@/components/public/CvList"

export default async function Bio() {
  const supabase = await supabaseServer()
  const [
    { data: soloRows, error: soloError },
    { data: groupRows, error: groupError },
    { data: educationRows, error: educationError },
    { data: residencyRows, error: residencyError },
    { data: awardsRows, error: awardsError },
    { data: collectionsRows, error: collectionsError },
  ] = await Promise.all([
    supabase
      .from("bio_solo_exhibitions")
      .select("id, description, description_kr, display_order")
      .order("display_order", { ascending: true }),
    supabase
      .from("bio_group_exhibitions")
      .select("id, description, description_kr, display_order")
      .order("display_order", { ascending: true }),
    supabase
      .from("bio_education")
      .select("id, description, description_kr, display_order")
      .order("display_order", { ascending: true }),
    supabase
      .from("bio_residency")
      .select("id, description, description_kr, display_order")
      .order("display_order", { ascending: true }),
    supabase
      .from("bio_awards")
      .select("id, description, description_kr, display_order")
      .order("display_order", { ascending: true }),
    supabase
      .from("bio_collections")
      .select("id, description, description_kr, display_order")
      .order("display_order", { ascending: true }),
  ])

  if (
    soloError ||
    groupError ||
    educationError ||
    residencyError ||
    awardsError ||
    collectionsError
  ) {
    console.error("Failed to load CV data", {
      soloError,
      groupError,
      educationError,
      residencyError,
      awardsError,
      collectionsError,
    })
  }

  const mapItems = (
    rows?: {
      id: string
      description: string | null
      description_kr: string | null
    }[],
  ) =>
    rows?.map((row) => ({
      id: row.id,
      category: "",
      description: row.description ?? "",
      description_kr: row.description_kr ?? "",
    })) ?? []

  const soloItems = mapItems(soloRows ?? [])
  const groupItems = mapItems(groupRows ?? [])
  const educationItems = mapItems(educationRows ?? [])
  const residencyItems = mapItems(residencyRows ?? [])
  const awardsItems = mapItems(awardsRows ?? [])
  const collectionsItems = mapItems(collectionsRows ?? [])
  return (
    <div className="font-light">
      <DetailSubHeader segments={[{ label: "cv" }]} />
      <div className="flex md:flex-row flex-col w-full">
        <div className="md:flex-1">
          <div className="text-[14px] font-medium mb-2 mt-2 md:mt-0">
            원나래 | Narae Won
          </div>
          <div className="text-sm/4 font-light">1991 출생</div>
          <div className="text-sm/4 font-light">born in 1991</div>
          <Link
            href="https://www.instagram.com/naraeworks/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-black hover:text-red-500 transition-colors"
            aria-label="Visit Instagram profile"
          >
            <Instagram className="h-4 w-4" strokeWidth={1} />
            <span>@naraeworks</span>
          </Link>
        </div>
        <div className="mt-12 md:mt-0 md:flex-5 xl:flex-4  flex flex-col gap-16 md:gap-24">
          <div className="flex flex-col gap-4 md:gap-6">
            <CvList
              category="학력"
              items={educationItems}
              descriptionKey="description_kr"
            />
            <CvList
              category="개인전"
              items={soloItems}
              descriptionKey="description_kr"
            />
            <CvList
              category="그룹전"
              items={groupItems}
              descriptionKey="description_kr"
            />
            <CvList
              category="레지던시"
              items={residencyItems}
              descriptionKey="description_kr"
            />
            <CvList
              category="수상 및 선정"
              items={awardsItems}
              descriptionKey="description_kr"
            />
            <CvList
              category="소장"
              items={collectionsItems}
              descriptionKey="description_kr"
            />
          </div>
          <div className="flex flex-col gap-6 md:gap-8">
            <CvList category="Education" items={educationItems} />
            <CvList category="Solo Exhibitions" items={soloItems} />
            <CvList category="Group Exhibitions" items={groupItems} />
            <CvList category="Residency" items={residencyItems} />
            <CvList category="Awards & Selections" items={awardsItems} />
            <CvList category="Collection" items={collectionsItems} />
          </div>
        </div>
      </div>
    </div>
  )
}
