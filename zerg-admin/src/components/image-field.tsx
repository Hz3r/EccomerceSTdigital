"use client"

import * as React from "react"
import { ImageIcon, Loader2, TrashIcon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { assetUrl } from "@/lib/format"
import { cn } from "@/lib/utils"

export type UploadFolder = "products" | "categories" | "avatars" | "general" | "branding"

interface ImageFieldProps {
  value: string
  onChange: (url: string) => void
  folder: UploadFolder
  id?: string
  className?: string
  previewClassName?: string
}

// Vista previa + subir archivo al backend (POST /upload/:folder) o pegar una URL.
export function ImageField({ value, onChange, folder, id, className, previewClassName }: ImageFieldProps) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState("")

  const upload = async (file: File) => {
    setError("")
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen supera los 5 MB")
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await api.post<{ data: { url: string } }>(`/upload/${folder}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      onChange(res.data.data.url)
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(message ?? "No se pudo subir la imagen")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className={cn("flex gap-4", className)}>
      <div
        className={cn(
          "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/50",
          previewClassName
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(value)} alt="Vista previa" className="size-full object-contain" />
        ) : (
          <ImageIcon className="size-7 text-muted-foreground" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) upload(file)
          }}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <UploadIcon className="size-3.5" />}
            {uploading ? "Subiendo..." : "Subir imagen"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <TrashIcon className="size-3.5" />
              Quitar
            </Button>
          )}
        </div>
        <Input
          id={id}
          placeholder="o pega una URL: https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs"
        />
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP o GIF · máx. 5 MB</p>
        )}
      </div>
    </div>
  )
}
