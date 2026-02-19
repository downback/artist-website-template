import type { ExhibitionCategory } from "@/components/admin/exhibition/ExhibitionUploadModal"

export type ExhibitionPreviewItem = {
  id: string
  exhibitionId: string
  imageUrl: string
  exhibitionTitle: string
  caption: string
  category: ExhibitionCategory
  description: string
  exhibitionOrder: number
  imageOrder: number
  createdAt: string
}
