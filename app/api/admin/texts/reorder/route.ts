import { NextResponse } from "next/server"
import {
  createServerErrorResponse,
  insertActivityLog,
  parseJsonBody,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import {
  createUpdateErrorResponse,
  validateOrderedIds,
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
      orderedTextIds?: string[]
    }>(request)
    if (!body || parseErrorResponse) {
      return parseErrorResponse
    }

    const orderedIds = body.orderedTextIds ?? []
    const validationErrorResponse = validateOrderedIds({
      orderedIds,
      missingMessage: "Missing text order.",
      invalidIdMessage: "Invalid text id.",
    })
    if (validationErrorResponse) {
      return validationErrorResponse
    }

    const total = orderedIds.length
    const updates = orderedIds.map((id, index) =>
      supabase
        .from("texts")
        .update({ display_order: total - index })
        .eq("id", id),
    )

    const results = await Promise.all(updates)
    const updateErrorResponse = createUpdateErrorResponse(
      results,
      "Unable to reorder texts.",
    )
    if (updateErrorResponse) {
      return updateErrorResponse
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "update",
      entityType: "text",
      entityId: orderedIds[0],
      metadata: { reordered: true },
      logContext: "Texts reorder",
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to reorder texts", { error })
    return createServerErrorResponse("Server error while reordering texts.")
  }
}
