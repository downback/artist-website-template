import { z } from "zod"

const minimumYear = 1900
const maximumYear = 2100

const textPayloadSchema = z
  .object({
    title: z.unknown(),
    body: z.unknown(),
    year: z.unknown(),
  })
  .superRefine((payload, context) => {
    const title =
      typeof payload.title === "string" ? payload.title.toString().trim() : ""
    const body =
      typeof payload.body === "string" ? payload.body.toString().trim() : ""
    const year = payload.year

    if (!title || !body) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Title and body are required.",
      })
      return
    }

    if (typeof year !== "number" || Number.isNaN(year)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Year must be a number.",
      })
      return
    }

    if (year < minimumYear || year > maximumYear) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Year must be between ${minimumYear} and ${maximumYear}.`,
      })
    }
  })
  .transform((payload) => ({
    title: (payload.title as string).toString().trim(),
    body: (payload.body as string).toString().trim(),
    year: payload.year as number,
  }))

const workMetadataSchema = z
  .object({
    yearRaw: z.string(),
    title: z.string(),
    caption: z.string(),
  })
  .superRefine((input, context) => {
    const yearRaw = input.yearRaw.trim()
    const title = input.title.trim()
    const caption = input.caption.trim()

    if (!yearRaw) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Year is required.",
      })
      return
    }

    const year = Number(yearRaw)
    if (Number.isNaN(year)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Year must be a number.",
      })
      return
    }

    if (year < minimumYear || year > maximumYear) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Year must be between ${minimumYear} and ${maximumYear}.`,
      })
      return
    }

    if (!title) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Title is required.",
      })
      return
    }

    if (!caption) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Caption is required.",
      })
    }
  })
  .transform((input) => ({
    year: Number(input.yearRaw.trim()),
    title: input.title.trim(),
    caption: input.caption.trim(),
  }))

type ValidationResult<T> =
  | { data: T; errorMessage: null }
  | { data: null; errorMessage: string }

export type TextPayloadValidationData = {
  title: string
  body: string
  year: number
}

export type WorkMetadataValidationData = {
  year: number
  title: string
  caption: string
}

export const validateTextPayload = (
  payload: unknown,
): ValidationResult<TextPayloadValidationData> => {
  const parseResult = textPayloadSchema.safeParse(payload)
  if (!parseResult.success) {
    return {
      data: null,
      errorMessage: parseResult.error.issues[0]?.message || "Invalid request body.",
    }
  }

  return {
    data: parseResult.data as TextPayloadValidationData,
    errorMessage: null,
  }
}

export const validateWorkMetadata = (input: {
  yearRaw: string
  title: string
  caption: string
}): ValidationResult<WorkMetadataValidationData> => {
  const parseResult = workMetadataSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      data: null,
      errorMessage: parseResult.error.issues[0]?.message || "Invalid request body.",
    }
  }

  return {
    data: parseResult.data as WorkMetadataValidationData,
    errorMessage: null,
  }
}
