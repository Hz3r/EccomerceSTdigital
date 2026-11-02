"use client"

import * as React from "react"
import { ImageIcon, Loader2, TrashIcon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { assetUrl } from "@/lib/format"
import { IMAGE_ACCEPT, MAX_IMAGE_SIZE, uploadErrorMessage, uploadImage, type UploadFolder } from "@/lib/upload"
import { cn } from "@/lib/utils"

export type { UploadFolder }

interface ImageFieldProps {
  value: string
  onChange: (url: string) => void
  folder: UploadFolder
  id?: string
  className?: string
  previewClassName?: string
}

// Sube un archivo al backend (POST /upload/:folder) y entrega la URL resultante.
function useImageUpload(folder: UploadFolder, onChange: (url: string) => void) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState("")

  const upload = async (file: File) => {
    setError("")
    if (file.size > MAX_IMAGE_SIZE) {
      setError("La imagen supera los 5 MB")
      return
    }
    setUploading(true)
    try {
      onChange(await uploadImage(folder, file))
    } catch (err) {
      setError(uploadErrorMessage(err, "No se pudo subir la imagen"))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const input = (
    <input
      ref={fileRef}
      type="file"
      accept={IMAGE_ACCEPT}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) upload(file)
      }}
    />
  )

  return { input, pick: () => fileRef.current?.click(), uploading, error }
}

// Vista previa + subir archivo al backend (POST /upload/:folder) o pegar una URL.
export function ImageField({ value, onChange, folder, id, className, previewClassName }: ImageFieldProps) {
  const { input, pick, uploading, error } = useImageUpload(folder, onChange)
  // Si la imagen no carga se muestra un aviso en vez del ícono roto del navegador.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const broken = Boolean(value) && failedSrc === value

  return (
    <div className={cn("flex gap-4", className)}>
      <div
        className={cn(
          "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/50",
          previewClassName
        )}
      >
        {value && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetUrl(value)}
            alt="Vista previa"
            onError={() => setFailedSrc(value)}
            className="size-full object-contain"
          />
        ) : broken ? (
          <div className="flex flex-col items-center gap-1 p-2 text-center text-muted-foreground">
            <ImageIcon className="size-7" />
            <span className="text-[11px]">No se pudo cargar la imagen. Vuelve a subirla.</span>
          </div>
        ) : (
          <ImageIcon className="size-7 text-muted-foreground" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {input}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={pick} disabled={uploading}>
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

// Miniatura para listas (logos de plataformas, íconos del menú): clic para subir, botón para quitar.
export function ImageThumbField({ value, onChange, folder, label = "Imagen", className }: {
  value: string
  onChange: (url: string) => void
  folder: UploadFolder
  label?: string
  className?: string
}) {
  const { input, pick, uploading, error } = useImageUpload(folder, onChange)

  return (
    <div className={cn("group/thumb relative shrink-0", className)}>
      {input}
      <button
        type="button"
        onClick={pick}
        disabled={uploading}
        title={error || (value ? `Cambiar ${label.toLowerCase()}` : `Subir ${label.toLowerCase()}`)}
        aria-label={value ? `Cambiar ${label.toLowerCase()}` : `Subir ${label.toLowerCase()}`}
        className={cn(
          "flex size-full items-center justify-center overflow-hidden rounded-lg border bg-muted/50 transition-colors hover:border-brand",
          error && "border-destructive",
          !value && "border-dashed"
        )}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(value)} alt="" className="size-full object-contain p-1" />
        ) : (
          <UploadIcon className="size-4 text-muted-foreground" />
        )}
      </button>
      {value && !uploading && (
        <button
          type="button"
          aria-label={`Quitar ${label.toLowerCase()}`}
          onClick={() => onChange("")}
          className="absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full border bg-background shadow-sm group-hover/thumb:flex hover:text-destructive focus-visible:flex"
        >
          <TrashIcon className="size-3" />
        </button>
      )}
    </div>
  )
}
