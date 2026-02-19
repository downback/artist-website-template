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

export async function POST(request: Request) {
  try {
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

    const { data: text, error: insertError } = await supabase
      .from("texts")
      .insert({
        title,
        year,
        body,
      })
      .select("id, created_at")
      .single()

    if (insertError || !text) {
      return createMappedSupabaseErrorResponse({
        message: insertError?.message || "",
        tableHint: "texts",
        fallbackMessage: "Unable to save text entry.",
      })
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "add",
      entityType: "text",
      entityId: text.id,
      metadata: null,
      logContext: "Text create",
    })
    return NextResponse.json({ ok: true, id: text.id, createdAt: text.created_at })
  } catch (error) {
    console.error("Text create failed", { error })
    return createServerErrorResponse("Server error while saving text.")
  }
}
