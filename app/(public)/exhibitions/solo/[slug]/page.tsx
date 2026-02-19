import ExhibitionList from "@/components/public/ExhibitionList"
import DetailSubHeader from "@/components/public/shared/DetailSubHeader"
import { siteAssetsBucketName } from "@/lib/constants"
import { supabaseServer } from "@/lib/server"

type SoloExhibitionPageProps = {
  params: Promise<{ slug: string }>
}

const formatSlug = (slug: string) => slug.replace(/-/g, " ")
const bucketName = siteAssetsBucketName

export default async function SoloExhibitionPage({
  params,
}: SoloExhibitionPageProps) {
  const { slug } = await params
  const supabase = await supabaseServer()
  const { data: exhibition, error: exhibitionError } = await supabase
    .from("exhibitions")
    .select("id, title, slug, description")
    .eq("type", "solo")
    .eq("slug", slug)
    .maybeSingle()

  if (exhibitionError) {
    console.error("Failed to load solo exhibition", { slug, error: exhibitionError })
  }

  const { data: imageRows, error: imagesError } = await supabase
    .from("exhibition_images")
    .select("id, storage_path, caption, display_order, is_primary")
    .eq("exhibition_id", exhibition?.id ?? "")
    .order("display_order", { ascending: true })

  if (imagesError) {
    console.error("Failed to load solo exhibition images", {
      slug,
      error: imagesError,
    })
  }

  const images =
    imageRows
      ?.map((row) => {
        if (!row.storage_path) return null
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(row.storage_path)
        if (!publicData?.publicUrl) return null
        return {
          id: row.id,
          src: publicData.publicUrl,
          alt: row.caption ?? "Exhibition image",
          isPrimary: row.is_primary ?? false,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)) ?? []

  const mainImage = images.find((image) => image.isPrimary) ?? images[0]
  const detailImages = images.filter((image) => image.id !== mainImage?.id)
  const fallbackTitle = formatSlug(slug)
  const exhibitionTitle = exhibition?.title ?? fallbackTitle
  const exhibitionDescription = exhibition?.description ?? ""

  const items = mainImage
    ? [
        {
          id: `solo-${slug}`,
          title: exhibitionTitle,
          caption: mainImage.alt,
          description: exhibitionDescription,
          mainImageSrc: mainImage.src,
          mainImageAlt: mainImage.alt,
          detailImages: detailImages.map((image) => ({
            id: image.id,
            src: image.src,
            alt: image.alt,
          })),
        },
      ]
    : []
  return (
    <div className="space-y-4">
      <DetailSubHeader
        segments={[{ label: "solo exhibition", value: formatSlug(slug) }]}
      />
      <ExhibitionList items={items} />
    </div>
  )
}
