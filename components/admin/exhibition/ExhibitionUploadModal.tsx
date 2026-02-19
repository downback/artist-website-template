"use client"

import { useCallback, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import AdminDialog from "@/components/admin/shared/AdminDialog"
import SavingDotsLabel from "@/components/admin/shared/SavingDotsLabel"
import { useSingleImageInput } from "@/components/admin/shared/hooks/useSingleImageInput"
import ExhibitionAdditionalImagesPreview from "@/components/admin/exhibition/ExhibitionAdditionalImagesPreview"
import { useExhibitionImagePreviews } from "@/components/admin/exhibition/hooks/useExhibitionImagePreviews"
import { useModalOpenTransition } from "@/components/admin/shared/hooks/useModalOpenTransition"
import { exhibitionCategories } from "@/lib/constants"
export type { ExhibitionCategory } from "@/lib/constants"
import type { ExhibitionCategory } from "@/lib/constants"

export type ExhibitionFormValues = {
  mainImageFile: File | null
  category: ExhibitionCategory
  exhibitionTitle: string
  caption: string
  description: string
  additionalImages: File[]
  removedAdditionalImageIds?: string[]
}

type ExhibitionUploadModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onSave?: (values: ExhibitionFormValues) => void
  initialValues?: {
    mainImageUrl?: string
    category?: ExhibitionCategory
    exhibitionTitle?: string
    caption?: string
    description?: string
    additionalImages?: { id: string; url: string }[]
  }
  isEditMode?: boolean
  confirmLabel?: string
  isConfirmDisabled?: boolean
  isSubmitting?: boolean
  errorMessage?: string
}

export default function ExhibitionUploadModal({
  open,
  onOpenChange,
  title = "Add exhibition",
  description = "Upload exhibition images and add metadata.",
  onSave,
  initialValues,
  isEditMode = false,
  confirmLabel = "Save exhibition",
  isConfirmDisabled = false,
  isSubmitting = false,
  errorMessage,
}: ExhibitionUploadModalProps) {
  const [selectedMainImageName, setSelectedMainImageName] = useState("")
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [initialMainImageUrl, setInitialMainImageUrl] = useState("")
  const [category, setCategory] = useState<ExhibitionCategory>(
    exhibitionCategories[0],
  )
  const [exhibitionTitle, setExhibitionTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [details, setDetails] = useState("")
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<
    { id: string; url: string }[]
  >([])
  const [removedAdditionalImageIds, setRemovedAdditionalImageIds] = useState<
    string[]
  >([])
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorDialogMessage, setErrorDialogMessage] = useState("")
  const {
    maxFileSizeBytes,
    formatFileSize,
    mainImagePreviewUrl,
    additionalPreviewUrls,
    setMainPreviewFromFile,
    appendAdditionalPreviews,
    removeAdditionalPreviewAt,
    clearPreviews,
  } = useExhibitionImagePreviews()

  const showError = (message: string) => {
    setErrorDialogMessage(message)
    setErrorDialogOpen(true)
  }

  const applyInitialValues = useCallback(() => {
    clearPreviews()
    setSelectedMainImageName("")
    setMainImageFile(null)
    setCategory(initialValues?.category ?? exhibitionCategories[0])
    setExhibitionTitle(initialValues?.exhibitionTitle ?? "")
    setCaption(initialValues?.caption ?? "")
    setDetails(initialValues?.description ?? "")
    setInitialMainImageUrl(initialValues?.mainImageUrl ?? "")
    setExistingAdditionalImages(initialValues?.additionalImages ?? [])
    setRemovedAdditionalImageIds([])
    setAdditionalImages([])
  }, [clearPreviews, initialValues])

  const handleRemoveAdditionalImage = (indexToRemove: number) => {
    setAdditionalImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    )
    removeAdditionalPreviewAt(indexToRemove)
  }

  const handleRemoveExistingAdditionalImage = (id: string) => {
    setExistingAdditionalImages((prev) => prev.filter((item) => item.id !== id))
    setRemovedAdditionalImageIds((prev) =>
      prev.includes(id) ? prev : [...prev, id],
    )
  }

  const handleAcceptedMainImage = useCallback(
    (file: File) => {
      setSelectedMainImageName(file.name)
      setMainImageFile(file)
      setMainPreviewFromFile(file)
    },
    [setMainPreviewFromFile],
  )

  const handleOversizeMainImage = useCallback(
    (file: File) => {
      showError(
        `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxFileSizeBytes)}.`,
      )
    },
    [formatFileSize, maxFileSizeBytes],
  )

  const {
    handleDragOver: handleMainImageDragOver,
    handleDrop: handleMainImageDrop,
    handleInputChange: handleMainImageInputChange,
  } = useSingleImageInput({
    maxFileSizeBytes,
    onFileAccepted: handleAcceptedMainImage,
    onFileOversize: handleOversizeMainImage,
  })

  useModalOpenTransition({ open, onOpen: applyInitialValues })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      clearPreviews()
      setSelectedMainImageName("")
      setMainImageFile(null)
      setInitialMainImageUrl("")
      setCategory(exhibitionCategories[0])
      setExhibitionTitle("")
      setCaption("")
      setDetails("")
      setAdditionalImages([])
      setExistingAdditionalImages([])
      setRemovedAdditionalImageIds([])
    }

    onOpenChange(nextOpen)
  }

  const initialExhibitionTitle = initialValues?.exhibitionTitle ?? ""
  const initialCaption = initialValues?.caption ?? ""
  const initialDescription = initialValues?.description ?? ""

  const hasChanges =
    mainImageFile !== null ||
    exhibitionTitle !== initialExhibitionTitle ||
    caption !== initialCaption ||
    details !== initialDescription ||
    additionalImages.length > 0 ||
    removedAdditionalImageIds.length > 0

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
              <Label htmlFor="upload-main-image">
                Main image upload{isEditMode ? " (optional)" : ""}
              </Label>
              <label
                htmlFor="upload-main-image"
                className="flex min-h-[120px] w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                onDrop={handleMainImageDrop}
                onDragOver={handleMainImageDragOver}
              >
                <span>
                  Drop image here or click to upload
                  {selectedMainImageName ? (
                    <span className="mt-2 block text-xs text-muted-foreground">
                      Selected: {selectedMainImageName}
                    </span>
                  ) : null}
                </span>
              </label>
              <Input
                id="upload-main-image"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="sr-only"
                onChange={handleMainImageInputChange}
              />
              {mainImagePreviewUrl || initialMainImageUrl ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <Image
                    src={mainImagePreviewUrl || initialMainImageUrl}
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
              <Label htmlFor="exhibition-title">Exhibition title *</Label>
              <Textarea
                id="exhibition-title"
                value={exhibitionTitle}
                onChange={(event) => setExhibitionTitle(event.target.value)}
                placeholder="메뉴바에 들어갈 전시 타이틀을 입력해주세요"
                className="min-h-[60px]"
                disabled={isEditMode}
              />
              <div className="flex flex-col gap-0">
                <div className="text-xs text-muted-foreground">
                  *위 타이틀은 최초 업로드 후 수정이 불가능 합니다.
                </div>
                <div className="text-xs text-muted-foreground">
                  가능한 간결하게 띄어쓰기에 유의하여 작성해주세요.
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exhibition-caption">
                Exhibition information *
              </Label>
              <Textarea
                id="exhibition-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="전시 메인 이미지 하단에 들어갈 전시 설명 텍스트를 입력해주세요"
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exhibition-description">
                Exhibition description
              </Label>
              <Textarea
                id="exhibition-description"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="전시 상세설명을 입력해주세요(선택사항)"
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-additional-images">
                Additional images
              </Label>
              <Input
                id="upload-additional-images"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  if (files.length === 0) return

                  const oversizedFiles = files.filter(
                    (file) => file.size > maxFileSizeBytes,
                  )
                  if (oversizedFiles.length > 0) {
                    const fileList = oversizedFiles
                      .map(
                        (file) =>
                          `"${file.name}" (${formatFileSize(file.size)})`,
                      )
                      .join(", ")
                    showError(
                      `아래 파일(들)의 용량이 너무 큽니다: ${fileList}. 최대 용량인 ${formatFileSize(maxFileSizeBytes)} 이하의 이미지(들)로 다시 업로드 해주세요.`,
                    )
                    event.target.value = ""
                    return
                  }

                  const existingKeys = new Set(
                    additionalImages.map(
                      (file) =>
                        `${file.name}-${file.size}-${file.lastModified}`,
                    ),
                  )
                  const newFiles = files.filter((file) => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`
                    if (existingKeys.has(key)) return false
                    existingKeys.add(key)
                    return true
                  })
                  if (newFiles.length === 0) {
                    event.target.value = ""
                    return
                  }
                  setAdditionalImages((prev) => [...prev, ...newFiles])
                  appendAdditionalPreviews(newFiles)
                  event.target.value = ""
                }}
              />
              <ExhibitionAdditionalImagesPreview
                existingAdditionalImages={existingAdditionalImages}
                additionalPreviewUrls={additionalPreviewUrls}
                onRemoveExistingAdditionalImage={
                  handleRemoveExistingAdditionalImage
                }
                onRemoveAdditionalPreviewImage={handleRemoveAdditionalImage}
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
                  mainImageFile,
                  category,
                  exhibitionTitle,
                  caption,
                  description: details,
                  additionalImages,
                  removedAdditionalImageIds,
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
