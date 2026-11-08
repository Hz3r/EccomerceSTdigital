"use client"

import * as React from "react"
import {
  AlertTriangle,
  Heading,
  HelpCircle,
  Image as ImageIcon,
  ListOrdered,
  Loader2,
  MousePointerClick,
  Pilcrow,
  Plus,
  UploadIcon,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageField } from "@/components/image-field"
import { ListControls, moveItem, removeItem, replaceItem } from "@/components/cms/list-controls"
import { MAX_VIDEO_SIZE, VIDEO_ACCEPT, uploadErrorMessage, uploadVideo } from "@/lib/upload"
import { videoKind, type PageBlock } from "@/lib/pages"
import { cn } from "@/lib/utils"

const area =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

export const BLOCK_META: Record<PageBlock["tipo"], { label: string; icon: typeof Heading; create: () => PageBlock }> = {
  titulo: { label: "Título", icon: Heading, create: () => ({ tipo: "titulo", texto: "" }) },
  texto: { label: "Texto", icon: Pilcrow, create: () => ({ tipo: "texto", texto: "" }) },
  video: { label: "Video", icon: Video, create: () => ({ tipo: "video", url: "", titulo: "" }) },
  imagen: { label: "Imagen", icon: ImageIcon, create: () => ({ tipo: "imagen", url: "", alt: "", pie: "" }) },
  pasos: { label: "Pasos", icon: ListOrdered, create: () => ({ tipo: "pasos", items: [{ titulo: "", texto: "" }] }) },
  faq: { label: "Preguntas", icon: HelpCircle, create: () => ({ tipo: "faq", titulo: "", items: [{ pregunta: "", respuesta: "" }] }) },
  aviso: { label: "Aviso", icon: AlertTriangle, create: () => ({ tipo: "aviso", variante: "info", texto: "" }) },
  boton: { label: "Botón", icon: MousePointerClick, create: () => ({ tipo: "boton", texto: "", url: "" }) },
}

const AVISOS = { info: "Información (azul)", exito: "Positivo (verde)", alerta: "Importante (amarillo)" } as const

const VIDEO_LABEL = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  tiktok: "TikTok",
  file: "Video subido",
  unknown: "Enlace (se mostrará como botón \"Ver video\")",
}

function VideoBlockEditor({ block, onChange }: { block: Extract<PageBlock, { tipo: "video" }>; onChange: (b: PageBlock) => void }) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [progress, setProgress] = React.useState<number | null>(null)
  const [error, setError] = React.useState("")
  const kind = block.url ? videoKind(block.url) : null

  const upload = async (file: File) => {
    setError("")
    if (file.size > MAX_VIDEO_SIZE) {
      setError(`El video supera los ${Math.round(MAX_VIDEO_SIZE / 1024 / 1024)} MB. Súbelo a YouTube o TikTok y pega el enlace.`)
      return
    }
    setProgress(0)
    try {
      onChange({ ...block, url: await uploadVideo(file, setProgress) })
    } catch (err) {
      setError(uploadErrorMessage(err, "No se pudo subir el video"))
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={block.url}
          placeholder="https://youtube.com/watch?v=… · youtube.com/shorts/… · tiktok.com/@…/video/…"
          aria-label="Enlace del video"
          onChange={(e) => onChange({ ...block, url: e.target.value })}
        />
        <input ref={fileRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" disabled={progress !== null} onClick={() => fileRef.current?.click()}>
          {progress !== null ? <Loader2 className="size-3.5 animate-spin" /> : <UploadIcon className="size-3.5" />}
          {progress !== null ? `${progress}%` : "Subir"}
        </Button>
      </div>
      {kind && <p className={cn("text-xs", kind === "unknown" ? "text-viz-warning" : "text-brand-strong dark:text-brand-bright")}>{VIDEO_LABEL[kind]}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Input value={block.titulo} placeholder="Título o descripción (opcional)" aria-label="Título del video" onChange={(e) => onChange({ ...block, titulo: e.target.value })} />
      <p className="text-[11px] text-muted-foreground">Recomendado: YouTube (también Shorts) o TikTok, cargan rápido en el celular. Subir archivo: MP4, WebM o MOV.</p>
    </div>
  )
}

function BlockFields({ block, onChange }: { block: PageBlock; onChange: (b: PageBlock) => void }) {
  switch (block.tipo) {
    case "titulo":
      return <Input value={block.texto} placeholder="Ej. Pagar con Yape" aria-label="Título" className="font-semibold" onChange={(e) => onChange({ ...block, texto: e.target.value })} />
    case "texto":
      return (
        <textarea
          rows={Math.min(14, Math.max(4, block.texto.split("\n").length + 1))}
          value={block.texto}
          aria-label="Texto"
          placeholder="Escribe aquí. Deja una línea en blanco entre párrafos."
          onChange={(e) => onChange({ ...block, texto: e.target.value })}
          className={area}
        />
      )
    case "video":
      return <VideoBlockEditor block={block} onChange={onChange} />
    case "imagen":
      return (
        <div className="space-y-2">
          <ImageField value={block.url} onChange={(url) => onChange({ ...block, url })} folder="general" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={block.alt} placeholder="Qué muestra la imagen (accesibilidad)" aria-label="Descripción" onChange={(e) => onChange({ ...block, alt: e.target.value })} />
            <Input value={block.pie} placeholder="Pie de foto (opcional)" aria-label="Pie de foto" onChange={(e) => onChange({ ...block, pie: e.target.value })} />
          </div>
        </div>
      )
    case "pasos":
      return (
        <div className="space-y-2">
          {block.items.map((step, j) => (
            <div key={j} className="flex gap-2 rounded-lg border bg-background p-2">
              <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-ink">{j + 1}</span>
              <div className="flex-1 space-y-1.5">
                <Input value={step.titulo} placeholder="Título del paso" aria-label={`Título del paso ${j + 1}`} onChange={(e) => onChange({ ...block, items: replaceItem(block.items, j, { titulo: e.target.value }) })} />
                <textarea rows={2} value={step.texto} placeholder="Explicación" aria-label={`Explicación del paso ${j + 1}`} onChange={(e) => onChange({ ...block, items: replaceItem(block.items, j, { texto: e.target.value }) })} className={area} />
              </div>
              <ListControls
                index={j}
                length={block.items.length}
                label={`paso ${j + 1}`}
                className="flex-col self-start"
                onMove={(dir) => onChange({ ...block, items: moveItem(block.items, j, dir) })}
                onRemove={() => onChange({ ...block, items: removeItem(block.items, j) })}
              />
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" disabled={block.items.length >= 30} onClick={() => onChange({ ...block, items: [...block.items, { titulo: "", texto: "" }] })}>
            <Plus className="size-3.5" /> Agregar paso
          </Button>
        </div>
      )
    case "faq":
      return (
        <div className="space-y-2">
          <Input value={block.titulo} placeholder="Título del grupo (opcional), ej. Pagos" aria-label="Título del grupo" onChange={(e) => onChange({ ...block, titulo: e.target.value })} />
          {block.items.map((f, j) => (
            <div key={j} className="flex gap-2 rounded-lg border bg-background p-2">
              <div className="flex-1 space-y-1.5">
                <Input value={f.pregunta} placeholder="Pregunta" aria-label={`Pregunta ${j + 1}`} className="font-medium" onChange={(e) => onChange({ ...block, items: replaceItem(block.items, j, { pregunta: e.target.value }) })} />
                <textarea rows={2} value={f.respuesta} placeholder="Respuesta" aria-label={`Respuesta ${j + 1}`} onChange={(e) => onChange({ ...block, items: replaceItem(block.items, j, { respuesta: e.target.value }) })} className={area} />
              </div>
              <ListControls
                index={j}
                length={block.items.length}
                label={`pregunta ${j + 1}`}
                className="flex-col self-start"
                onMove={(dir) => onChange({ ...block, items: moveItem(block.items, j, dir) })}
                onRemove={() => onChange({ ...block, items: removeItem(block.items, j) })}
              />
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" disabled={block.items.length >= 30} onClick={() => onChange({ ...block, items: [...block.items, { pregunta: "", respuesta: "" }] })}>
            <Plus className="size-3.5" /> Agregar pregunta
          </Button>
        </div>
      )
    case "aviso":
      return (
        <div className="space-y-2">
          <Select value={block.variante} onValueChange={(v) => v && onChange({ ...block, variante: v as typeof block.variante })}>
            <SelectTrigger size="sm" className="w-56" aria-label="Estilo del aviso">
              <SelectValue>{AVISOS[block.variante]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(AVISOS) as (keyof typeof AVISOS)[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {AVISOS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <textarea rows={2} value={block.texto} placeholder="Texto del aviso" aria-label="Texto del aviso" onChange={(e) => onChange({ ...block, texto: e.target.value })} className={area} />
        </div>
      )
    case "boton":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={block.texto} placeholder="Texto, ej. Ver productos" aria-label="Texto del botón" onChange={(e) => onChange({ ...block, texto: e.target.value })} />
          <Input value={block.url} placeholder="/products o https://…" aria-label="Enlace del botón" onChange={(e) => onChange({ ...block, url: e.target.value })} />
        </div>
      )
  }
}

/** Editor de bloques: cada bloque se puede editar, mover o quitar, y se agregan nuevos al final. */
export function BlocksEditor({ blocks, onChange }: { blocks: PageBlock[]; onChange: (blocks: PageBlock[]) => void }) {
  return (
    <div className="space-y-3">
      {blocks.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Esta página no tiene contenido. Agrega un bloque abajo.</p>}
      {blocks.map((block, i) => {
        const meta = BLOCK_META[block.tipo]
        return (
          <div key={i} className="rounded-xl border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2">
              <meta.icon className="size-4 text-muted-foreground" />
              <span className="flex-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">{meta.label}</span>
              <ListControls
                index={i}
                length={blocks.length}
                label={`bloque ${i + 1}`}
                onMove={(dir) => onChange(moveItem(blocks, i, dir))}
                onRemove={() => onChange(removeItem(blocks, i))}
              />
            </div>
            <BlockFields block={block} onChange={(b) => onChange(blocks.map((x, j) => (j === i ? b : x)))} />
          </div>
        )
      })}

      <div className="rounded-xl border border-dashed p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Agregar bloque</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(BLOCK_META) as PageBlock["tipo"][]).map((tipo) => {
            const meta = BLOCK_META[tipo]
            return (
              <Button key={tipo} type="button" variant="outline" size="sm" disabled={blocks.length >= 80} onClick={() => onChange([...blocks, meta.create()])}>
                <meta.icon className="size-3.5" />
                {meta.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
