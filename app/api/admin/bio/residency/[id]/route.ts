import { NextResponse } from "next/server"
import {
  createBadRequestResponse,
  createServerErrorResponse,
  insertActivityLog,
  parseJsonBody,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import { supabaseServer } from "@/lib/server"
import { isUuid } from "@/lib/validation"

type BioPayload = {
  description?: string
  description_kr?: string
}

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!isUuid(id)) {
      console.error("Invalid residency id", { id })
      return createBadRequestResponse("Invalid id.")
    }

    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: body, errorResponse: parseErrorResponse } =
      await parseJsonBody<BioPayload>(request)
    if (!body || parseErrorResponse) {
      return parseErrorResponse
    }

    const description = body.description?.trim()
    const descriptionKr = body.description_kr?.trim()

    if (!description || !descriptionKr) {
      return createBadRequestResponse(
        "Description and Korean description are required.",
      )
    }

    const { data, error } = await supabase
      .from("bio_residency")
      .update({ description, description_kr: descriptionKr })
      .eq("id", id)
      .select("description, description_kr")
      .single()

    if (error || !data) {
      console.error("Residency update error", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      })
      return createServerErrorResponse(
        error?.message || "Unable to update residency entry.",
      )
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "update",
      entityType: "cv_detail",
      entityId: id,
      metadata: { section: "residency" },
      logContext: "Residency update",
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Residency update failed", { error })
    return createServerErrorResponse("Server error while updating residency.")
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!isUuid(id)) {
      console.error("Invalid residency id", { id })
      return createBadRequestResponse("Invalid id.")
    }

    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { error } = await supabase.from("bio_residency").delete().eq("id", id)

    if (error) {
      console.error("Residency delete error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return createServerErrorResponse(
        error.message || "Unable to delete residency entry.",
      )
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "delete",
      entityType: "cv_detail",
      entityId: id,
      metadata: { section: "residency" },
      logContext: "Residency delete",
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Residency delete failed", { error })
    return createServerErrorResponse("Server error while deleting residency.")
  }
}
