"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AddYearCardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (year: string) => void
  trigger: ReactNode
  title?: string
  description?: string
  label?: string
  placeholder?: string
  confirmLabel?: string
  validate?: (value: string) => string | null
}

const defaultValidate = (value: string) => {
  if (!value) return "Enter a year."
  if (!/^\d{4}$/.test(value)) return "Year must be a 4-digit number."
  return null
}

export default function AddYearCard({
  open,
  onOpenChange,
  onConfirm,
  trigger,
  title = "Add year",
  description = "Create a new year category for works.",
  label = "Year",
  placeholder = "ex. 2027",
  confirmLabel = "Add year",
  validate = defaultValidate,
}: AddYearCardProps) {
  const [yearInput, setYearInput] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    const resetTimeout = setTimeout(() => {
      setYearInput("")
      setError("")
    }, 0)
    return () => clearTimeout(resetTimeout)
  }, [open])

  const handleConfirm = () => {
    const trimmed = yearInput.trim()
    const validationError = validate(trimmed)
    if (validationError) {
      setError(validationError)
      return
    }
    onConfirm(trimmed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4/5 md:max-w-lg rounded-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="year-input">{label}</Label>
          <Input
            id="year-input"
            value={yearInput}
            onChange={(event) => setYearInput(event.target.value)}
            placeholder={placeholder}
            inputMode="numeric"
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant="highlight" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
