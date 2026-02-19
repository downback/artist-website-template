import { NextResponse } from "next/server"
import {
  createBadRequestResponse,
  createMappedSupabaseErrorResponse,
  createServerErrorResponse,
  insertActivityLog,
  parseJsonBody,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import {
  validateTextPayload,
  type TextPayloadValidationData,
} from "@/lib/requestValidation"
import { supabaseServer } from "@/lib/server"
import { isUuid } from "@/lib/validation"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!isUuid(id)) {
      return createBadRequestResponse("Invalid id.")
    }

    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { data: payload, errorResponse: parseErrorResponse } = await parseJsonBody<{
      title?: string
      year?: number
      body?: string
    }>(request)
    if (!payload || parseErrorResponse) {
      return parseErrorResponse
    }

    const textValidationResult = validateTextPayload(payload)
    if (!textValidationResult.data || textValidationResult.errorMessage) {
      return createBadRequestResponse(
        textValidationResult.errorMessage || "Invalid request body.",
      )
    }
    const validatedData = textValidationResult.data as TextPayloadValidationData
    const { title, body, year } = validatedData

    const { data: updated, error: updateError } = await supabase
      .from("texts")
      .update({
        title,
        year,
        body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, created_at")
      .single()

    if (updateError || !updated) {
      return createMappedSupabaseErrorResponse({
        message: updateError?.message || "",
        tableHint: "texts",
        fallbackMessage: "Unable to update text entry.",
      })
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "update",
      entityType: "text",
      entityId: updated.id,
      metadata: null,
      logContext: "Text update",
    })
    return NextResponse.json({ ok: true, id: updated.id, createdAt: updated.created_at })
  } catch (error) {
    console.error("Text update failed", { error })
    return createServerErrorResponse("Server error while updating text.")
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    if (!isUuid(id)) {
      return createBadRequestResponse("Invalid id.")
    }

    const supabase = await supabaseServer()
    const { user, errorResponse } = await requireAdminUser(supabase)
    if (!user || errorResponse) {
      return errorResponse
    }

    const { error: deleteError } = await supabase
      .from("texts")
      .delete()
      .eq("id", id)

    if (deleteError) {
      return createMappedSupabaseErrorResponse({
        message: deleteError.message,
        tableHint: "texts",
        fallbackMessage: "Unable to update text entry.",
      })
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "delete",
      entityType: "text",
      entityId: id,
      metadata: null,
      logContext: "Text delete",
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Text delete failed", { error })
    return createServerErrorResponse("Server error while deleting text.")
  }
}
