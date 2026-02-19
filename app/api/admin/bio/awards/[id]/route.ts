import { NextResponse } from "next/server"
import {
  createBadRequestResponse,
  createServerErrorResponse,
  createUnauthorizedResponse,
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
      console.error("Invalid awards id", { id })
      return createBadRequestResponse("Invalid id.")
    }

    const supabase = await supabaseServer()
    const adminUserResult = await requireAdminUser(supabase)
    if (adminUserResult.errorResponse) {
      return adminUserResult.errorResponse
    }
    if (!adminUserResult.user) {
      return createUnauthorizedResponse()
    }
    const user = adminUserResult.user

    const parseResult = await parseJsonBody<BioPayload>(request)
    if (parseResult.errorResponse) {
      return parseResult.errorResponse
    }
    const body = parseResult.data

    const description = body.description?.trim()
    const descriptionKr = body.description_kr?.trim()

    if (!description || !descriptionKr) {
      return createBadRequestResponse(
        "Description and Korean description are required.",
      )
    }

    const { data, error } = await supabase
      .from("bio_awards")
      .update({ description, description_kr: descriptionKr })
      .eq("id", id)
      .select("description, description_kr")
      .single()

    if (error || !data) {
      console.error("Awards update error", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      })
      return createServerErrorResponse(
        error?.message || "Unable to update awards entry.",
      )
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "update",
      entityType: "cv_detail",
      entityId: id,
      metadata: { section: "awards & selections" },
      logContext: "Awards update",
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Awards update failed", { error })
    return createServerErrorResponse("Server error while updating awards.")
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!isUuid(id)) {
      console.error("Invalid awards id", { id })
      return createBadRequestResponse("Invalid id.")
    }

    const supabase = await supabaseServer()
    const adminUserResult = await requireAdminUser(supabase)
    if (adminUserResult.errorResponse) {
      return adminUserResult.errorResponse
    }
    if (!adminUserResult.user) {
      return createUnauthorizedResponse()
    }
    const user = adminUserResult.user

    const { error } = await supabase.from("bio_awards").delete().eq("id", id)

    if (error) {
      console.error("Awards delete error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return createServerErrorResponse(
        error.message || "Unable to delete awards entry.",
      )
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "delete",
      entityType: "cv_detail",
      entityId: id,
      metadata: { section: "awards & selections" },
      logContext: "Awards delete",
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Awards delete failed", { error })
    return createServerErrorResponse("Server error while deleting awards.")
  }
}
