import api from "@/lib/axios"

export type UploadFolder = "products" | "categories" | "avatars" | "general" | "branding" | "videos"

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

export const MAX_VIDEO_SIZE = 80 * 1024 * 1024
export const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime"

// Videos de las guías de ayuda (POST /upload/videos), con el avance de la subida en %.
export function uploadVideo(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  return api
    .post<{ data: { url: string } }>("/upload/videos", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 10 * 60 * 1000,
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })
    .then((res) => res.data.data.url)
}
