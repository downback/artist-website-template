"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import AdminDialog from "@/components/admin/shared/AdminDialog"
import SavingDotsLabel from "@/components/admin/shared/SavingDotsLabel"
import { useSingleImageInput } from "@/components/admin/shared/hooks/useSingleImageInput"
import { useModalOpenTransition } from "@/components/admin/shared/hooks/useModalOpenTransition"
import { formatFileSize, maxImageFileSizeBytes } from "@/lib/fileUpload"

export type WorkFormValues = {
  imageFile: File | null
  year: string
  title: string
  caption: string
}

type WorkUploadModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onSave?: (values: WorkFormValues) => void
  yearOptions?: string[]
  isYearSelectDisabled?: boolean
  selectedYearCategory?: string
  initialValues?: {
    imageUrl?: string
    year?: string
    title?: string
    caption?: string
  }
  isEditMode?: boolean
  confirmLabel?: string
  isConfirmDisabled?: boolean
  isSubmitting?: boolean
  errorMessage?: string
}

export default function WorkUploadModal({
  open,
  onOpenChange,
  title = "Update Content",
  description = "Upload a work image and add metadata.",
  onSave,
  yearOptions = [],
  isYearSelectDisabled = false,
  selectedYearCategory,
  initialValues,
  isEditMode = false,
  confirmLabel = "Confirm change",
  isConfirmDisabled = false,
  isSubmitting = false,
  errorMessage,
}: WorkUploadModalProps) {
  const [selectedImageName, setSelectedImageName] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [initialImageUrl, setInitialImageUrl] = useState(
    initialValues?.imageUrl ?? "",
  )
  const [year, setYear] = useState(initialValues?.year ?? "")
  const [titleValue, setTitleValue] = useState(initialValues?.title ?? "")
  const [caption, setCaption] = useState(initialValues?.caption ?? "")
  const wasSubmittingRef = useRef(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorDialogMessage, setErrorDialogMessage] = useState("")

  const showError = (message: string) => {
    setErrorDialogMessage(message)
    setErrorDialogOpen(true)
  }

  const applyInitialValues = useCallback(() => {
    setSelectedImageName("")
    setImageFile(null)
    setImagePreviewUrl("")
    setYear(initialValues?.year ?? "")
    setTitleValue(initialValues?.title ?? "")
    setCaption(initialValues?.caption ?? "")
    setInitialImageUrl(initialValues?.imageUrl ?? "")
  }, [initialValues])

  const handleAcceptedImageFile = useCallback((file: File) => {
    setSelectedImageName(file.name)
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }, [])

  const handleOversizeImageFile = useCallback(
    (file: File, source: "drop" | "input") => {
      if (source === "input") {
        showError(
          `해당 파일의 용량이 너무 큽니다: "${file.name}" (${formatFileSize(file.size)}). 최대 용량인 ${formatFileSize(maxImageFileSizeBytes)} 이하의 이미지(들)로 다시 업로드 해주세요.`,
        )
        return
      }
      showError(
        `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxImageFileSizeBytes)}.`,
      )
    },
    [],
  )

  const {
    handleDragOver: handleImageDragOver,
    handleDrop: handleImageDrop,
    handleInputChange: handleImageInputChange,
  } = useSingleImageInput({
    maxFileSizeBytes: maxImageFileSizeBytes,
    onFileAccepted: handleAcceptedImageFile,
    onFileOversize: handleOversizeImageFile,
  })

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  useEffect(() => {
    let resetTimeout: ReturnType<typeof setTimeout> | undefined
    if (!open) {
      wasSubmittingRef.current = false
      return
    }

    if (wasSubmittingRef.current && !isSubmitting && !errorMessage) {
      resetTimeout = setTimeout(() => {
        setSelectedImageName("")
        setImagePreviewUrl("")
        setImageFile(null)
        setInitialImageUrl("")
        setTitleValue("")
        setCaption("")
        setYear("")
      }, 0)
    }

    wasSubmittingRef.current = isSubmitting
    return () => {
      if (resetTimeout) clearTimeout(resetTimeout)
    }
  }, [open, isSubmitting, errorMessage])

  useModalOpenTransition({ open, onOpen: applyInitialValues })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedImageName("")
      setImagePreviewUrl("")
      setImageFile(null)
      setInitialImageUrl("")
      setYear("")
      setTitleValue("")
      setCaption("")
    }

    onOpenChange(nextOpen)
  }

  const initialYear = initialValues?.year ?? ""
  const initialTitle = initialValues?.title ?? ""
  const initialCaption = initialValues?.caption ?? ""

  const hasChanges =
    imageFile !== null ||
    year !== initialYear ||
    titleValue !== initialTitle ||
    caption !== initialCaption

  const isSaveDisabled =
    isConfirmDisabled || isSubmitting || (isEditMode && !hasChanges)

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4/5 md:max-w-lg rounded-md max-h-[70vh] md:max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload-image">
                Image upload{isEditMode ? " (optional)" : ""}
              </Label>
              <label
                htmlFor="upload-image"
                className="flex min-h-[120px] w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                onDrop={handleImageDrop}
                onDragOver={handleImageDragOver}
              >
                <span>
                  Drop image here or click to upload
                  {selectedImageName ? (
                    <span className="mt-2 block text-xs text-muted-foreground">
                      Selected: {selectedImageName}
                    </span>
                  ) : null}
                </span>
              </label>
              <Input
                id="upload-image"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="sr-only"
                onChange={handleImageInputChange}
              />
              {imagePreviewUrl || initialImageUrl ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <Image
                    src={imagePreviewUrl || initialImageUrl}
                    alt="Selected preview"
                    width={800}
                    height={400}
                    className="h-48 w-full object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-year">
                Year{isYearSelectDisabled ? "" : " *"}
              </Label>
              {isYearSelectDisabled ? (
                <div
                  id="work-year"
                  className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                >
                  {selectedYearCategory || "-"}
                </div>
              ) : (
                <Select value={year || undefined} onValueChange={setYear}>
                  <SelectTrigger id="work-year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-title">Title *</Label>
              <Textarea
                id="work-title"
                value={titleValue}
                onChange={(event) => setTitleValue(event.target.value)}
                placeholder="작업 타이틀을 입력해주세요"
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-caption">Caption *</Label>
              <Textarea
                id="work-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="작업 캡션을 입력해주세요"
                className="min-h-[60px]"
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
              onClick={() =>
                onSave?.({
                  imageFile,
                  year,
                  title: titleValue,
                  caption,
                })
              }
              disabled={isSaveDisabled}
            >
              {isSubmitting ? <SavingDotsLabel /> : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AdminDialog
        open={errorDialogOpen}
        onOpenChange={setErrorDialogOpen}
        title="File Upload Error"
        description={errorDialogMessage}
        confirmLabel="OK"
        variant="error"
        className="w-full max-w-[85vw] sm:max-w-md"
      />
    </>
  )
}
