"use client"

import { useCallback, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import SavingDotsLabel from "@/components/admin/shared/SavingDotsLabel"
import { useModalOpenTransition } from "@/components/admin/shared/hooks/useModalOpenTransition"

export type TextFormValues = {
  title: string
  year: string
  body: string
}

type TextUploadModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onSave?: (values: TextFormValues) => void
  initialValues?: TextFormValues
  confirmLabel?: string
  isConfirmDisabled?: boolean
  isSubmitting?: boolean
  errorMessage?: string
}

const defaultTextValues: TextFormValues = {
  title: "",
  year: "",
  body: "",
}

export default function TextUploadModal({
  open,
  onOpenChange,
  title = "Add text",
  description = "Create a new text entry for the public texts page.",
  onSave,
  initialValues,
  confirmLabel = "Save text",
  isConfirmDisabled = false,
  isSubmitting = false,
  errorMessage,
}: TextUploadModalProps) {
  const [formValues, setFormValues] =
    useState<TextFormValues>(defaultTextValues)
  const initialTitle = initialValues?.title ?? ""
  const initialYear = initialValues?.year ?? ""
  const initialBody = initialValues?.body ?? ""
  const normalizedInitialValues = useMemo(
    () => ({
      title: initialTitle,
      year: initialYear,
      body: initialBody,
    }),
    [initialTitle, initialYear, initialBody],
  )

  const applyInitialValues = useCallback(() => {
    setFormValues(normalizedInitialValues)
  }, [normalizedInitialValues])

  useModalOpenTransition({ open, onOpen: applyInitialValues })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormValues(defaultTextValues)
    }
    onOpenChange(nextOpen)
  }

  const updateField = (key: keyof TextFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const isEditMode = Boolean(initialValues)
  const hasChanges =
    formValues.title !== normalizedInitialValues.title ||
    formValues.year !== normalizedInitialValues.year ||
    formValues.body !== normalizedInitialValues.body

  const isSaveDisabled =
    isConfirmDisabled || isSubmitting || (isEditMode && !hasChanges)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4/5 md:max-w-lg rounded-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-title">Title *</Label>
            <Input
              id="text-title"
              value={formValues.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="텍스트 타이틀을 입력해주세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text-year">Year *</Label>
            <Input
              id="text-year"
              value={formValues.year}
              onChange={(event) => updateField("year", event.target.value)}
              placeholder="텍스트 연도를 입력해주세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text-body">Body *</Label>
            <Textarea
              id="text-body"
              value={formValues.body}
              onChange={(event) => updateField("body", event.target.value)}
              placeholder="텍스트 내용을 입력해주세요"
              className="min-h-[160px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {errorMessage ? (
            <p className="text-sm text-rose-600">{errorMessage}</p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
          >
            Dismiss
          </Button>
          <Button
            type="button"
            variant="highlight"
            onClick={() => onSave?.(formValues)}
            disabled={isSaveDisabled}
          >
            {isSubmitting ? <SavingDotsLabel /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
