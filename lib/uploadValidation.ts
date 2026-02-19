const oneMbInBytes = 1024 * 1024

export const maxImageUploadBytes = Math.floor(1.5 * oneMbInBytes)

export const validateImageUploadFile = (file: File) => {
  if (file.type && !file.type.startsWith("image/")) {
    return "Only image uploads are allowed."
  }

  if (file.size > maxImageUploadBytes) {
    return "Image file is too large. Maximum size is 1.5MB."
  }

  return null
}
