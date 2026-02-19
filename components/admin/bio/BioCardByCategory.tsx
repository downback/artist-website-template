"use client"

import { useEffect, useState } from "react"
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react"
import BioUploadModal from "@/components/admin/bio/BioUploadModal"
import AdminDialog from "@/components/admin/shared/AdminDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type BioItem = {
  id?: string
  description: string
  description_kr: string
}

export type BioCardKind =
  | "education"
  | "solo"
  | "group"
  | "residency"
  | "awards"
  | "collections"

export type BioCardConfig = {
  title: string
  items: BioItem[]
  kind: BioCardKind
}

export default function BioCardByCategory({
  title,
  items,
  kind,
}: BioCardConfig) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [currentItems, setCurrentItems] = useState(items)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState({
    description: "",
    description_kr: "",
  })

  useEffect(() => {
    const resetTimeout = setTimeout(() => {
      setCurrentItems(items)
    }, 0)
    return () => clearTimeout(resetTimeout)
  }, [items])

  const normalizeId = (value?: string | null) =>
    typeof value === "string" ? value.trim() : ""

  const hasValidId = (value?: string | null) => {
    const normalized = normalizeId(value)
    return (
      normalized.length > 0 &&
      normalized !== "undefined" &&
      /^[0-9a-fA-F-]{36}$/.test(normalized)
    )
  }

  const resetForm = () => {
    setFormValues({ description: "", description_kr: "" })
    setEditingId(null)
    setErrorMessage("")
  }

  const openCreateModal = () => {
    resetForm()
    setIsUploadOpen(true)
  }

  const openEditModal = (item: BioItem) => {
    if (!hasValidId(item.id)) {
      setErrorMessage("This entry is missing an id. Refresh the page.")
      return
    }
    setFormValues({
      description: item.description,
      description_kr: item.description_kr,
    })
    setEditingId(normalizeId(item.id))
    setErrorMessage("")
    setIsUploadOpen(true)
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch(`/api/admin/bio/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formValues.description,
          description_kr: formValues.description_kr,
        }),
      })

      const payload = (await response.json()) as {
        id?: string
        description?: string | null
        description_kr?: string | null
        error?: string
      }

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to add bio entry.")
        return
      }

      if (!payload.id) {
        setErrorMessage("Unable to save entry. Missing id from server.")
        return
      }

      const nextDescription = payload.description ?? formValues.description
      const nextDescriptionKr =
        payload.description_kr ?? formValues.description_kr

      setCurrentItems((prevItems) => [
        {
          id: payload.id,
          description: nextDescription,
          description_kr: nextDescriptionKr,
        },
        ...prevItems,
      ])
      setIsUploadOpen(false)
      resetForm()
    } catch (error) {
      console.error("Failed to create bio entry", { error })
      setErrorMessage("Unable to add bio entry. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!hasValidId(editingId)) {
      setErrorMessage("This entry is missing an id. Refresh the page.")
      return
    }
    console.log("Editing bio entry", { id: editingId, kind })
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const safeId = encodeURIComponent(normalizeId(editingId))
      const response = await fetch(`/api/admin/bio/${kind}/${safeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formValues.description,
          description_kr: formValues.description_kr,
        }),
      })

      const payload = (await response.json()) as {
        description?: string | null
        description_kr?: string | null
        error?: string
      }

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to update bio entry.")
        return
      }

      setCurrentItems((prevItems) =>
        prevItems.map((item) =>
          item.id === editingId
            ? {
                ...item,
                description: payload.description ?? formValues.description,
                description_kr:
                  payload.description_kr ?? formValues.description_kr,
              }
            : item,
        ),
      )
      setIsUploadOpen(false)
      resetForm()
    } catch (error) {
      console.error("Failed to update bio entry", { error })
      setErrorMessage("Unable to update bio entry. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: BioItem) => {
    if (!hasValidId(item.id)) {
      setErrorMessage("This entry is missing an id. Refresh the page.")
      return
    }
    console.log("Deleting bio entry", { id: item.id, kind })
    setDeletingId(item.id ?? null)
    setErrorMessage("")
    const startTime = Date.now()

    try {
      const safeId = encodeURIComponent(normalizeId(item.id))
      const response = await fetch(`/api/admin/bio/${kind}/${safeId}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to delete bio entry.")
        return
      }

      const elapsed = Date.now() - startTime
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed))
      }
      setCurrentItems((prevItems) =>
        prevItems.filter((entry) => entry.id !== item.id),
      )
      setDeleteDialogId(null)
    } catch (error) {
      console.error("Failed to delete bio entry", { error })
      setErrorMessage("Unable to delete bio entry. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const persistOrder = async (nextItems: BioItem[]) => {
    const payload = nextItems
      .map((item, index) => ({ id: item.id, display_order: index }))
      .filter((item) => item.id)

    if (payload.length === 0) return

    try {
      const response = await fetch(`/api/admin/bio/${kind}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        setErrorMessage(result.error || "Unable to save order.")
      }
    } catch (error) {
      console.error("Failed to save bio order", { error })
      setErrorMessage("Unable to save order. Please try again.")
    }
  }

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setCurrentItems((prevItems) => {
      const nextItems = [...prevItems]
      const [moved] = nextItems.splice(fromIndex, 1)
      nextItems.splice(toIndex, 0, moved)
      persistOrder(nextItems)
      return nextItems
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        {currentItems.map((item, index) => (
          <div
            key={item.id ?? `${item.description}-${index}`}
            className={`flex flex-row gap-3 border-b border-border pb-3 md:pb-4 last:border-b-0 first:border-t first:border-border first:pt-3 md:first:pt-4 last:pb-0 md:items-center justify-between ${
              dragOverIndex === index ? "bg-muted/40" : ""
            }`}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOverIndex(index)
            }}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={() => {
              if (draggedIndex !== null) {
                moveItem(draggedIndex, index)
              }
              setDraggedIndex(null)
              setDragOverIndex(null)
            }}
          >
            <div className="flex flex-row gap-4 md:gap-6 items-center">
              <div className="flex items-center text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="block text-sm">{item.description_kr}</span>
                <span className="block text-sm text-muted-foreground">
                  {item.description}
                </span>
              </div>
            </div>
            <div className="flex gap-0 md:gap-2 items-center">
              {hasValidId(item.id) ? null : (
                <span className="text-xs text-muted-foreground">
                  Missing id
                </span>
              )}
              <Button
                type="button"
                variant="default"
                size="icon"
                aria-label="Edit"
                className="shadow-none"
                onClick={() => openEditModal(item)}
                disabled={!hasValidId(item.id)}
              >
                <Pencil className="h-3 w-3 md:h-4 md:w-4 text-zinc-600 hover:text-zinc-400" />
              </Button>
              <AdminDialog
                open={deleteDialogId === item.id}
                isLoading={deletingId === item.id}
                onOpenChange={(nextOpen) => {
                  if (deletingId === item.id) return
                  setDeleteDialogId(nextOpen ? (item.id ?? null) : null)
                }}
                onConfirm={() => handleDelete(item)}
                disabled={!hasValidId(item.id)}
                trigger={
                  <Button
                    type="button"
                    variant="default"
                    size="icon"
                    aria-label="Delete"
                    className="shadow-none"
                    disabled={!hasValidId(item.id)}
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-500 hover:text-red-300" />
                  </Button>
                }
                title="Delete item?"
                description="삭제 후 복구할 수 없습니다. 진행하시겠습니까?"
                confirmLabel="Delete"
                loadingLabel="Deleting..."
                showCancel={true}
                variant="destructive"
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-left text-muted-foreground">
          Drag rows to reorder
        </p>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
          aria-label={`Add new detail in ${title.replace(" Information", "")}`}
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" />
          <span>Add new detail in {title.replace(" Information", "")}</span>
        </button>
      </CardContent>
      <BioUploadModal
        open={isUploadOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            resetForm()
          }
          setIsUploadOpen(nextOpen)
        }}
        title={
          editingId
            ? `Edit ${title.replace(" Information", "")} detail`
            : `Add ${title.replace(" Information", "")} detail`
        }
        description="Add or update biography text details."
        values={formValues}
        onValuesChange={setFormValues}
        onConfirm={editingId ? handleUpdate : handleCreate}
        confirmLabel={editingId ? "Save changes" : "Add detail"}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </Card>
  )
}
