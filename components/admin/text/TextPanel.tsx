"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import TextUploadModal, {
  type TextFormValues,
} from "@/components/admin/text/TextUploadModal"
import AdminDialog from "@/components/admin/shared/AdminDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseBrowser } from "@/lib/client"

type TextEntry = TextFormValues & {
  id: string
  createdAt: string
}

const buildPreviewText = (entry: TextEntry) => {
  if (entry.body.trim().length <= 140) return entry.body
  return `${entry.body.slice(0, 140)}...`
}

export default function TextPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [textEntries, setTextEntries] = useState<TextEntry[]>([])
  const [editingEntry, setEditingEntry] = useState<TextEntry | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = useMemo(() => supabaseBrowser(), [])

  const loadTextEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("texts")
      .select("id, title, year, body, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load texts", { error })
      return
    }

    const nextEntries = (data ?? []).map((entry) => ({
      id: entry.id,
      title: entry.title ?? "",
      year: entry.year ? String(entry.year) : "",
      body: entry.body ?? "",
      createdAt: entry.created_at ?? new Date().toISOString(),
    }))

    setTextEntries(nextEntries)
  }, [supabase])

  useEffect(() => {
    void loadTextEntries()
  }, [loadTextEntries])

  const handleSave = async (values: TextFormValues) => {
    const hasRequiredValues = values.title.trim() && values.body.trim()

    if (!hasRequiredValues) {
      setErrorMessage("Title and body are required.")
      return
    }

    const parsedYear = Number(values.year)
    if (!Number.isInteger(parsedYear)) {
      setErrorMessage("Year must be a number.")
      return
    }
    if (parsedYear < 1900 || parsedYear > 2100) {
      setErrorMessage("Year must be between 1900 and 2100.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const isEditMode = Boolean(editingEntry)
      const response = await fetch(
        isEditMode
          ? `/api/admin/texts/${editingEntry?.id}`
          : "/api/admin/texts",
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: values.title,
            year: parsedYear,
            body: values.body,
          }),
        },
      )

      const payload = (await response.json()) as {
        id?: string
        createdAt?: string
        error?: string
      }

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to save text entry.")
        return
      }

      if (!isEditMode) {
        if (payload.id && payload.createdAt) {
          const nextEntry: TextEntry = {
            ...values,
            id: payload.id,
            createdAt: payload.createdAt,
          }
          setTextEntries((prev) => [nextEntry, ...prev])
        } else {
          await loadTextEntries()
        }
      } else {
        setTextEntries((prev) =>
          prev.map((entry) =>
            entry.id === editingEntry?.id
              ? { ...entry, ...values, year: values.year }
              : entry,
          ),
        )
      }

      setErrorMessage("")
      setIsModalOpen(false)
      setEditingEntry(null)
    } catch (error) {
      console.error("Failed to save text entry", { error })
      setErrorMessage("Unable to save text entry. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (entry: TextEntry) => {
    setDeletingId(entry.id)
    setErrorMessage("")
    const startTime = Date.now()
    try {
      const response = await fetch(`/api/admin/texts/${entry.id}`, {
        method: "DELETE",
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete text entry.")
      }
      const elapsed = Date.now() - startTime
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed))
      }
      setTextEntries((prev) => prev.filter((item) => item.id !== entry.id))
      setDeleteDialogId(null)
    } catch (error) {
      console.error("Failed to delete text entry", { error })
      setErrorMessage("Unable to delete text entry. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const modalInitialValues = useMemo(() => {
    if (!editingEntry) return undefined
    return {
      title: editingEntry.title,
      year: editingEntry.year,
      body: editingEntry.body,
    }
  }, [editingEntry])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>비평 | 작가노트 | 기타 텍스트</CardTitle>
          <Button
            type="button"
            variant="highlight"
            onClick={() => {
              setErrorMessage("")
              setIsModalOpen(true)
            }}
          >
            Add text
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {textEntries.length === 0 ? (
            <p>No text entries yet.</p>
          ) : (
            <div className="grid gap-4">
              {textEntries.map((entry) => (
                <div key={entry.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {entry.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.year ? entry.year : "Year not set"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="icon"
                        aria-label="Edit"
                        className="shadow-none"
                        onClick={() => {
                          setEditingEntry(entry)
                          setErrorMessage("")
                          setIsModalOpen(true)
                        }}
                      >
                        <Pencil className="h-3 w-3 md:h-4 md:w-4 text-zinc-600 hover:text-zinc-400" />
                      </Button>
                      <AdminDialog
                        open={deleteDialogId === entry.id}
                        isLoading={deletingId === entry.id}
                        onOpenChange={(nextOpen) => {
                          if (deletingId === entry.id) return
                          setDeleteDialogId(nextOpen ? entry.id : null)
                        }}
                        onConfirm={() => handleDelete(entry)}
                        trigger={
                          <Button
                            type="button"
                            variant="default"
                            size="icon"
                            aria-label="Delete"
                            className="shadow-none"
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
                  <p className="mt-3 text-sm text-muted-foreground">
                    {buildPreviewText(entry)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TextUploadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
        title={editingEntry ? "Edit text" : "Add text"}
        confirmLabel={editingEntry ? "Update text" : "Save text"}
        initialValues={modalInitialValues}
        isSubmitting={isSubmitting}
        isConfirmDisabled={isSubmitting}
        errorMessage={errorMessage}
      />
    </div>
  )
}
