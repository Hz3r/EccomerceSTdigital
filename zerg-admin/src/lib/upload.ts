import api from "@/lib/axios"

export type UploadFolder = "products" | "categories" | "avatars" | "general" | "branding" | "videos"

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif"

const MAX_DIMENSION = 2000

/**
 * Las fotos grandes (capturas, diseños exportados en PNG de varios MB) hacen lenta la tienda.
 * Antes de subirlas se reducen a 2000 px como máximo y se convierten a WebP (conserva la transparencia).
 * Los GIF se suben tal cual para no perder la animación.
 */
export async function optimizeImage(file: File): Promise<File> {
  if (file.type === "image/gif" || typeof createImageBitmap === "undefined") return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= 400 * 1024) return file
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9))
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" })
  } catch {
    return file
  }
}

// Sube un archivo al backend (POST /upload/:folder) y devuelve la URL relativa resultante.
export async function uploadImage(folder: UploadFolder, file: File): Promise<string> {
  // El límite de 5 MB se revisa después de optimizar: una foto pesada suele quedar muy por debajo
  const optimized = await optimizeImage(file)
  if (optimized.size > MAX_IMAGE_SIZE) throw new Error("La imagen supera los 5 MB incluso optimizada. Prueba con una más pequeña.")
  const form = new FormData()
  form.append("file", optimized)
  return api
    .post<{ data: { url: string } }>(`/upload/${folder}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data.data.url)
}

export function uploadErrorMessage(err: unknown, fallback: string) {
  const e = err as { response?: { data?: { message?: string } }; message?: string }
  return e.response?.data?.message ?? (err instanceof Error && !("isAxiosError" in err) ? e.message : undefined) ?? fallback
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
