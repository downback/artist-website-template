"use client"

type SavingDotsLabelProps = {
  label?: string
}

export default function SavingDotsLabel({
  label = "Saving",
}: SavingDotsLabelProps) {
  return (
    <span className="inline-flex items-end gap-1">
      <span>{label}</span>
      <span className="admin-saving-dots " aria-hidden="true">
        <span className="admin-saving-dot admin-saving-dot-1 mb-1" />
        <span className="admin-saving-dot admin-saving-dot-2 mb-1" />
        <span className="admin-saving-dot admin-saving-dot-3 mb-1" />
      </span>
    </span>
  )
}
