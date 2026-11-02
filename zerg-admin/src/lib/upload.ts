import api from "@/lib/axios"

export type UploadFolder = "products" | "categories" | "avatars" | "general" | "branding"

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif"

// Sube un archivo al backend (POST /upload/:folder) y devuelve la URL relativa resultante.
export function uploadImage(folder: UploadFolder, file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  return api
    .post<{ data: { url: string } }>(`/upload/${folder}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data.data.url)
}

export function uploadErrorMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback
}
