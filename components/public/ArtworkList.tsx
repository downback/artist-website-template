import ArtworkItem from "@/components/public/ArtworkItem"

type Artwork = {
  id: string
  title: string
  caption: string
  imageSrc?: string
  imageAlt?: string
}

type ArtworkListProps = {
  items?: Artwork[]
}

export default function ArtworkList({ items = [] }: ArtworkListProps) {
  return (
    <div className="w-full flex flex-col justify-center items-center gap-14">
      {items.map((item) => (
        <ArtworkItem
          key={item.id}
          title={item.title}
          caption={item.caption}
          imageSrc={item.imageSrc}
          imageAlt={item.imageAlt}
        />
      ))}
    </div>
  )
}
