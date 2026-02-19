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
      console.error("Invalid collection id", { id })
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
      .from("bio_collections")
      .update({ description, description_kr: descriptionKr })
      .eq("id", id)
      .select("description, description_kr")
      .single()

    if (error || !data) {
      console.error("Collection update error", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      })
      return createServerErrorResponse(
        error?.message || "Unable to update collection entry.",
      )
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "update",
      entityType: "cv_detail",
      entityId: id,
      metadata: { section: "collection" },
      logContext: "Collection update",
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Collection update failed", { error })
    return createServerErrorResponse("Server error while updating collection.")
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!isUuid(id)) {
      console.error("Invalid collection id", { id })
      return createBadRequestResponse("Invalid id.")
    }

    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { error } = await supabase
      .from("bio_collections")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Collection delete error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return createServerErrorResponse(
        error.message || "Unable to delete collection entry.",
      )
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "delete",
      entityType: "cv_detail",
      entityId: id,
      metadata: { section: "collection" },
      logContext: "Collection delete",
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Collection delete failed", { error })
    return createServerErrorResponse("Server error while deleting collection.")
  }
}
