"use client"

import * as React from "react"
import { Loader2, PlusIcon } from "lucide-react"
import { ListControls, moveItem, removeItem } from "@/components/cms/list-controls"
import { assetUrl } from "@/lib/format"
import { IMAGE_ACCEPT, MAX_IMAGE_SIZE, uploadErrorMessage, uploadImage, type UploadFolder } from "@/lib/upload"
import { cn } from "@/lib/utils"

interface ImageGalleryFieldProps {
  /** Fotos adicionales. La portada (coverUrl) vive en su propio campo y no se edita aquí. */
  value: string[]
  onChange: (urls: string[]) => void
  folder: UploadFolder
  /** Imagen principal: se muestra como primera celda, solo lectura. */
  coverUrl?: string
  /** Total de fotos que admite la galería (portada incluida). */
  max?: number
  /** Proporción de cada miniatura. La tienda recorta igual con object-cover. */
  tileClassName?: string
  /** Pasa la foto i de la galería a portada. */
  onMakeCover?: (index: number) => void
}

interface UploadOptions {
  value: string[]
  max: number
  onChange: (urls: string[]) => void
}

// Sube varios archivos en serie para conservar el orden en que se eligieron.
function useMultiImageUpload(folder: UploadFolder, { value, max, onChange }: UploadOptions) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [progress, setProgress] = React.useState<{ current: number; total: number } | null>(null)
  const [error, setError] = React.useState("")

  // Último valor disponible cuando termina la subida, varios segundos después del clic.
  const latest = React.useRef(value)
  React.useEffect(() => {
    latest.current = value
  }, [value])

  const upload = async (files: File[]) => {
    setError("")
    if (files.some((file) => file.size > MAX_IMAGE_SIZE)) {
      setError("Hay imágenes de más de 5 MB")
      return
    }
    setProgress({ current: 0, total: files.length })
    try {
      const urls: string[] = []
      for (const [i, file] of files.entries()) {
        setProgress({ current: i + 1, total: files.length })
        urls.push(await uploadImage(folder, file))
      }
      const next = [...latest.current, ...urls]
      onChange(next.slice(0, max))
      if (next.length > max) setError(`La galería admite ${max} fotos: se guardaron las primeras ${max}`)
    } catch (err) {
      setError(uploadErrorMessage(err, "No se pudieron subir todas las imágenes"))
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const input = (
    <input
      ref={fileRef}
      type="file"
      multiple
      accept={IMAGE_ACCEPT}
      className="hidden"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? [])
        if (files.length) void upload(files)
      }}
    />
  )

  return { input, pick: () => fileRef.current?.click(), progress, error }
}

/** Rejilla para subir, ordenar y quitar varias imágenes del mismo campo. */
export function ImageGalleryField({ value, onChange, folder, coverUrl, max = 10, tileClassName, onMakeCover }: ImageGalleryFieldProps) {
  const { input, pick, progress, error } = useMultiImageUpload(folder, { value, max, onChange })

  const uploading = progress !== null
  const tile = tileClassName ?? "aspect-[4/3]"
  const freeSlots = max - value.length - (coverUrl ? 1 : 0)

  return (
    <div className="space-y-3">
      {input}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {coverUrl && (
          <figure className="space-y-1">
            <div className={cn("relative overflow-hidden rounded-xl border bg-muted/50", tile)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(coverUrl)} alt="Portada" className="size-full object-cover" />
              <span className="absolute top-1.5 left-1.5 rounded-full bg-surface-ink/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                Portada
              </span>
            </div>
            <figcaption className="text-center text-[11px] text-muted-foreground">Imagen principal</figcaption>
          </figure>
        )}

        {value.map((url, i) => (
          <figure key={url} className="space-y-1">
            <div className={cn("relative overflow-hidden rounded-xl border bg-muted/50", tile)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(url)} alt={`Foto ${i + 1}`} className="size-full object-cover" />
            </div>
            <div className="flex items-center justify-between gap-1">
              <ListControls
                index={i}
                length={value.length}
                label="foto"
                onMove={(dir) => onChange(moveItem(value, i, dir))}
                onRemove={() => onChange(removeItem(value, i))}
                className="-ml-1"
              />
              {onMakeCover && (
                <button
                  type="button"
                  onClick={() => onMakeCover(i)}
                  className="rounded p-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Hacer portada
                </button>
              )}
            </div>
          </figure>
        ))}

        {freeSlots > 0 && (
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-brand hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
              tile
            )}
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <PlusIcon className="size-5" />}
            <span className="text-[11px] font-medium">Agregar fotos</span>
          </button>
        )}
      </div>

      {progress ? (
        <p className="text-xs text-muted-foreground">
          Subiendo {progress.current} de {progress.total}…
        </p>
      ) : error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Hasta {max} fotos · JPG, PNG, WebP o GIF · máx. 5 MB. La tienda recorta cada foto a la proporción del lugar donde se muestre.
        </p>
      )}
    </div>
  )
}
