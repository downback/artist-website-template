"use client"
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
import SavingDotsLabel from "@/components/admin/shared/SavingDotsLabel"

type BioFormValues = {
  description: string
  description_kr: string
}

type BioUploadModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  values: BioFormValues
  onValuesChange: (values: BioFormValues) => void
  onConfirm?: () => void
  confirmLabel?: string
  isConfirmDisabled?: boolean
  isSubmitting?: boolean
  errorMessage?: string
}

export default function BioUploadModal({
  open,
  onOpenChange,
  title = "Update Content",
  description = "Update text content.",
  values,
  onValuesChange,
  onConfirm,
  confirmLabel = "Confirm change",
  isConfirmDisabled = false,
  isSubmitting = false,
  errorMessage,
}: BioUploadModalProps) {
  const hasRequiredValues =
    values.description.trim().length > 0 &&
    values.description_kr.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4/5 md:max-w-lg rounded-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upload-description-kr">약력 및 이력 (한글)</Label>
            <Input
              id="upload-description-kr"
              type="text"
              placeholder="ex. 2022 | 전시 타이틀 | 전시장명 | 도시, 국가"
              value={values.description_kr}
              onChange={(event) =>
                onValuesChange({
                  ...values,
                  description_kr: event.target.value,
                })
              }
            />
            <Label htmlFor="upload-description">약력 및 이력 (영문)</Label>
            <Input
              id="upload-description"
              type="text"
              placeholder="ex. 2022 | Exhibition Title | Exhibition Space | City, Country"
              value={values.description}
              onChange={(event) =>
                onValuesChange({
                  ...values,
                  description: event.target.value,
                })
              }
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
            onClick={() => onOpenChange(false)}
          >
            Dismiss
          </Button>
          <Button
            type="button"
            variant="highlight"
            onClick={onConfirm}
            disabled={!hasRequiredValues || isConfirmDisabled || isSubmitting}
          >
            {isSubmitting ? <SavingDotsLabel /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
