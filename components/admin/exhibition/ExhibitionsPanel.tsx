"use client"

import ExhibitionUploadModal from "@/components/admin/exhibition/ExhibitionUploadModal"
import ExhibitionCardByCategory from "@/components/admin/exhibition/ExhibitionCardByCategory"
import { useExhibitionsPanelData } from "@/components/admin/exhibition/hooks/useExhibitionsPanelData"
import { useExhibitionsReorder } from "@/components/admin/exhibition/hooks/useExhibitionsReorder"

export default function ExhibitionsPanel() {
  const {
    isUploadOpen,
    setIsUploadOpen,
    isUploading,
    errorMessage,
    setErrorMessage,
    previewItems,
    setPreviewItems,
    editingItem,
    resetSignal,
    selectedCategory,
    soloItems,
    groupItems,
    modalInitialValues,
    handleSave,
    handleDelete,
    handleEdit,
    loadPreviewItems,
    openAddModal,
  } = useExhibitionsPanelData()

  const {
    dragOverIndex,
    dragCategory,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragLeave,
  } = useExhibitionsReorder({
    previewItems,
    setPreviewItems,
    setErrorMessage,
    loadPreviewItems,
  })

  return (
    <div className="space-y-6">
      <ExhibitionCardByCategory
        title="Solo exhibitions"
        category="solo-exhibitions"
        items={soloItems}
        dragOverIndex={dragOverIndex}
        dragCategory={dragCategory}
        onAdd={openAddModal}
        onEdit={(item) => {
          void handleEdit(item)
        }}
        onDelete={(item) => handleDelete(item)}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      <ExhibitionCardByCategory
        title="Group exhibitions"
        category="group-exhibitions"
        items={groupItems}
        dragOverIndex={dragOverIndex}
        dragCategory={dragCategory}
        onAdd={openAddModal}
        onEdit={(item) => {
          void handleEdit(item)
        }}
        onDelete={(item) => handleDelete(item)}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      <ExhibitionUploadModal
        key={`exhibition-modal-${resetSignal}`}
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        title={
          editingItem
            ? `Edit ${editingItem.category === "solo-exhibitions" ? "solo" : "group"} exhibition`
            : `Add ${selectedCategory === "solo-exhibitions" ? "solo" : "group"} exhibition`
        }
        description={`${editingItem?.category === "solo-exhibitions" ? "개인" : "그룹"}전 이미지 및 세부정보를 업로드 및 수정 할 수 있습니다`}
        onSave={handleSave}
        initialValues={modalInitialValues}
        isEditMode={Boolean(editingItem)}
        confirmLabel={editingItem ? "Save updates" : "Save exhibition"}
        isConfirmDisabled={isUploading}
        isSubmitting={isUploading}
        errorMessage={errorMessage}
      />
    </div>
  )
}
