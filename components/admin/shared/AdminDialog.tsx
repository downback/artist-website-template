"use client"

import { ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import SavingDotsLabel from "@/components/admin/shared/SavingDotsLabel"

type AdminDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: () => void
  trigger?: ReactNode
  title?: string
  description?: string
  confirmLabel?: string
  loadingLabel?: string
  cancelLabel?: string
  showCancel?: boolean
  variant?: "default" | "destructive" | "error"
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export default function AdminDialog({
  open,
  onOpenChange,
  onConfirm,
  trigger,
  title = "Alert",
  description = "",
  confirmLabel = "OK",
  loadingLabel = "Loading...",
  cancelLabel = "Cancel",
  showCancel = false,
  variant = "default",
  isLoading = false,
  disabled = false,
  className,
}: AdminDialogProps) {
  const normalizedLoadingLabel = loadingLabel.replace(/\.+$/, "")

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {showCancel && (
            <AlertDialogCancel disabled={isLoading}>
              {cancelLabel}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              handleConfirm()
            }}
            disabled={disabled || isLoading}
            className={
              variant === "destructive" || variant === "error"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {isLoading ? (
              <SavingDotsLabel label={normalizedLoadingLabel} />
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
