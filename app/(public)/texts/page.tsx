import DetailSubHeader from "@/components/public/shared/DetailSubHeader"
import TextList from "@/components/public/TextList"
import { supabaseServer } from "@/lib/server"

export default async function Contact() {
  const supabase = await supabaseServer()
  const { data: rows, error } = await supabase
    .from("texts")
    .select("id, year, title, body, created_at")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to load texts", { error })
  }

  const items =
    rows?.map((row) => ({
      id: row.id,
      year: row.year ? String(row.year) : "",
      title: row.title ?? "",
      body: row.body ?? "",
    })) ?? []

  return (
    <div className="space-y-4">
      <DetailSubHeader segments={[{ label: "text" }]} />
      <div className="w-full flex justify-end items-start">
        <TextList items={items} />
      </div>
    </div>
  )
}
