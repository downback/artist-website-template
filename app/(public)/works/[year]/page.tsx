import ArtworkList from "@/components/public/ArtworkList"
import DetailSubHeader from "@/components/public/shared/DetailSubHeader"
import {
  siteAssetsBucketName,
  worksYearRangeDisplay,
  worksYearRangeValue,
} from "@/lib/constants"
import { supabaseServer } from "@/lib/server"

type WorksByYearPageProps = {
  params: Promise<{ year: string }>
}

const bucketName = siteAssetsBucketName
const rangePattern = /^(\d{4})-(\d{4})$/

export default async function WorksByYearPage({
  params,
}: WorksByYearPageProps) {
  const { year } = await params
  const rangeMatch = year.match(rangePattern)
  const startYear = rangeMatch ? Number(rangeMatch[1]) : Number(year)
  const endYear = rangeMatch ? Number(rangeMatch[2]) : Number(year)
  const displayYear = year === worksYearRangeValue ? worksYearRangeDisplay : year

  const supabase = await supabaseServer()
  let query = supabase
    .from("artworks")
    .select("id, title, year, display_order")
    .eq("category", "works")
    .order("display_order", { ascending: false })

  if (!Number.isNaN(startYear) && !Number.isNaN(endYear)) {
    query = query.gte("year", startYear).lte("year", endYear)
  }

  const { data: rows, error } = await query

  if (error) {
    console.error("Failed to load works for year", { year, error })
  }

  const artworkIds = (rows ?? []).map((row) => row.id).filter(Boolean)
  let primaryImageByArtworkId = new Map<
    string,
    { storage_path: string | null; caption: string | null }
  >()
  if (artworkIds.length > 0) {
    const { data: primaryImages, error: primaryImagesError } = await supabase
      .from("artwork_images")
      .select("artwork_id, storage_path, caption")
      .in("artwork_id", artworkIds)
      .eq("is_primary", true)

    if (primaryImagesError) {
      console.error("Failed to load work images for year", {
        year,
        error: primaryImagesError,
      })
    } else {
      primaryImageByArtworkId = new Map(
        (primaryImages ?? []).map((image) => [
          image.artwork_id,
          {
            storage_path: image.storage_path ?? null,
            caption: image.caption ?? null,
          },
        ]),
      )
    }
  }

  const items =
    rows
      ?.map((row) => {
        const primaryImage = primaryImageByArtworkId.get(row.id)
        if (!primaryImage?.storage_path) return null
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(primaryImage.storage_path)
        if (!publicData?.publicUrl) return null
        const caption = primaryImage.caption ?? ""
        return {
          id: row.id,
          title: row.title ?? "Work title",
          caption,
          imageSrc: publicData.publicUrl,
          imageAlt: row.title ?? caption ?? "Work image",
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)) ?? []

  return (
    <div className="space-y-4">
      <DetailSubHeader segments={[{ label: "work", value: displayYear }]} />
      <ArtworkList items={items} />
    </div>
  )
}
