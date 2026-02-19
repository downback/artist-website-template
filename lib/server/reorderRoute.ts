import { NextResponse } from "next/server"
import { isUuid } from "@/lib/validation"

export type ReorderItem = {
  id: string
  display_order: number
}

type ValidateItemsInput = {
  items: ReorderItem[]
  missingMessage: string
  invalidIdMessage: string
}

type ValidateOrderedIdsInput = {
  orderedIds: string[]
  missingMessage: string
  invalidIdMessage: string
}

export const validateReorderItems = ({
  items,
  missingMessage,
  invalidIdMessage,
}: ValidateItemsInput) => {
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: missingMessage }, { status: 400 })
  }

  if (items.some((item) => !isUuid(item.id))) {
    return NextResponse.json({ error: invalidIdMessage }, { status: 400 })
  }

  return null as NextResponse | null
}

export const validateOrderedIds = ({
  orderedIds,
  missingMessage,
  invalidIdMessage,
}: ValidateOrderedIdsInput) => {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: missingMessage }, { status: 400 })
  }

  if (orderedIds.some((id) => !isUuid(id))) {
    return NextResponse.json({ error: invalidIdMessage }, { status: 400 })
  }

  return null as NextResponse | null
}

export const createUpdateErrorResponse = (
  results: Array<{ error: { message?: string | null } | null }>,
  fallbackMessage: string,
) => {
  const firstError = results.find((result) => result.error)?.error
  if (!firstError) {
    return null as NextResponse | null
  }

  return NextResponse.json(
    { error: firstError.message || fallbackMessage },
    { status: 500 },
  )
}
