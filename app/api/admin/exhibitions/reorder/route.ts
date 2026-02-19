import { NextResponse } from "next/server"
import { exhibitionCategories, type ExhibitionCategory } from "@/lib/constants"
import {
  createBadRequestResponse,
  createServerErrorResponse,
  parseJsonBody,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import {
  createUpdateErrorResponse,
  validateOrderedIds,
} from "@/lib/server/reorderRoute"
import { supabaseServer } from "@/lib/server"

type AllowedCategory = ExhibitionCategory

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: body, errorResponse: parseErrorResponse } = await parseJsonBody<{
      category?: string
      orderedExhibitionIds?: string[]
    }>(request)
    if (!body || parseErrorResponse) {
      return parseErrorResponse
    }

    const category = body.category?.trim()
    const isAllowedCategory = (value: string): value is AllowedCategory =>
      exhibitionCategories.includes(value as AllowedCategory)
    if (!category || !isAllowedCategory(category)) {
      return createBadRequestResponse("Invalid category.")
    }

    const orderedIds = body.orderedExhibitionIds ?? []
    const validationErrorResponse = validateOrderedIds({
      orderedIds,
      missingMessage: "Missing exhibition order.",
      invalidIdMessage: "Invalid exhibition id.",
    })
    if (validationErrorResponse) {
      return validationErrorResponse
    }

    const exhibitionType = category === "solo-exhibitions" ? "solo" : "group"
    const updates = orderedIds.map((id, index) =>
      supabase
        .from("exhibitions")
        .update({ display_order: index })
        .eq("id", id)
        .eq("type", exhibitionType),
    )

    const results = await Promise.all(updates)
    const updateErrorResponse = createUpdateErrorResponse(
      results,
      "Unable to reorder exhibitions.",
    )
    if (updateErrorResponse) {
      return updateErrorResponse
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to reorder exhibitions", { error })
    return createServerErrorResponse("Server error while reordering exhibitions.")
  }
}
