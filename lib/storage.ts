type BuildStoragePathOptions = {
  prefix: string
  file: File
  defaultExtension?: string
}

export const buildStoragePathWithPrefix = ({
  prefix,
  file,
  defaultExtension = "",
}: BuildStoragePathOptions) => {
  const extension = file.name.split(".").pop() || ""
  const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, "")
  const suffix = safeExtension
    ? `.${safeExtension}`
    : defaultExtension.startsWith(".")
      ? defaultExtension
      : defaultExtension
        ? `.${defaultExtension}`
        : ""

  return `${prefix}/${Date.now()}-${crypto.randomUUID()}${suffix}`
}
