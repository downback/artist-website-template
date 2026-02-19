import { NextResponse } from "next/server"
import {
  createBadRequestResponse,
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
      yearLabel?: string
      orderedWorkIds?: string[]
    }>(request)
    if (!body || parseErrorResponse) {
      return parseErrorResponse
    }

    const orderedIds = body.orderedWorkIds ?? []
    const validationErrorResponse = validateOrderedIds({
      orderedIds,
      missingMessage: "Missing work order.",
      invalidIdMessage: "Invalid work id.",
    })
    if (validationErrorResponse) {
      return validationErrorResponse
    }

    const total = orderedIds.length
    const updates = orderedIds.map((id, index) =>
      supabase
        .from("artworks")
        .update({ display_order: total - index })
        .eq("id", id)
        .eq("category", "works"),
    )

    const results = await Promise.all(updates)
    const updateErrorResponse = createUpdateErrorResponse(
      results,
      "Unable to reorder works.",
    )
    if (updateErrorResponse) {
      return updateErrorResponse
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "update",
      entityType: "artwork",
      entityId: orderedIds[0],
      metadata: { category: "works", yearLabel: body.yearLabel ?? null },
      logContext: "Works reorder",
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to reorder works", { error })
    return createServerErrorResponse("Server error while reordering works.")
  }
}
