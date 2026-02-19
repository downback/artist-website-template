import { NextResponse } from "next/server"
import {
  createBadRequestResponse,
  createServerErrorResponse,
  insertActivityLog,
  parseJsonBody,
  requireAdminUser,
} from "@/lib/server/adminRoute"
import { supabaseServer } from "@/lib/server"

type BioPayload = {
  description?: string
  description_kr?: string
}

export async function POST(request: Request) {
  try {
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
      .insert({
        description,
        description_kr: descriptionKr,
        display_order: 0,
      })
      .select("id, description, description_kr")
      .single()

    if (error || !data) {
      console.error("Residency create error", { message: error?.message })
      return createServerErrorResponse("Unable to create residency entry.")
    }

    await insertActivityLog(supabase, {
      adminId: user.id,
      actionType: "add",
      entityType: "cv_detail",
      entityId: data.id,
      metadata: { section: "residency" },
      logContext: "Residency create",
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Residency create failed", { error })
    return createServerErrorResponse(
      "Server error while creating residency entry.",
    )
  }
}
