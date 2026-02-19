import { NextResponse } from "next/server"
import {
  createServerErrorResponse,
  parseJsonBody,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import {
  createUpdateErrorResponse,
  type ReorderItem,
  validateReorderItems,
} from "@/lib/server/reorderRoute"
import { supabaseServer } from "@/lib/server"

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: body, errorResponse: parseErrorResponse } = await parseJsonBody<{
      items?: ReorderItem[]
    }>(request)
    if (!body || parseErrorResponse) {
      return parseErrorResponse
    }
    const items = body.items ?? []

    const validationErrorResponse = validateReorderItems({
      items,
      missingMessage: "No items provided.",
      invalidIdMessage: "Invalid id in items.",
    })
    if (validationErrorResponse) {
      return validationErrorResponse
    }

    const updates = items.map((item) =>
      supabase
        .from("bio_solo_exhibitions")
        .update({ display_order: item.display_order })
        .eq("id", item.id)
    )

    const results = await Promise.all(updates)
    const updateErrorResponse = createUpdateErrorResponse(
      results,
      "Unable to update solo show order.",
    )
    if (updateErrorResponse) {
      return updateErrorResponse
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Solo show reorder failed", { error })
    return createServerErrorResponse("Server error while saving order.")
  }
}
