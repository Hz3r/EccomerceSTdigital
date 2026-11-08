"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, BookOpen, ExternalLink, FileText, HelpCircle, Loader2, Lock, Pencil, PlayCircle, Plus, ShieldCheck, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageIntro, Section } from "@/components/cms/form"
import { moveItem } from "@/components/cms/list-controls"
import { confirmAction, toast } from "@/components/feedback"
import api from "@/lib/axios"
import { STORE_URL } from "@/lib/format"
import { useLiveVersion } from "@/lib/live"
import { storePath, type FixedPageSummary, type GuideSummary, type HelpPage } from "@/lib/pages"
import { cn } from "@/lib/utils"

const ICONS: Record<string, typeof BookOpen> = {
  "como-comprar": BookOpen,
  "preguntas-frecuentes": HelpCircle,
  garantia: ShieldCheck,
  terminos: FileText,
  privacidad: Lock,
}
const MOVE = "rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
const dateFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" })
const errorMessage = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback

export default function HelpPagesAdmin() {
  const router = useRouter()
  const [data, setData] = React.useState<{ fijas: FixedPageSummary[]; guias: GuideSummary[] } | null>(null)
  const [creating, setCreating] = React.useState(false)
  const version = useLiveVersion("pages")

  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: { fijas: FixedPageSummary[]; guias: GuideSummary[] } }>("/pages/admin")
      .then((res) => !cancelled && setData(res.data.data))
      .catch(() => !cancelled && setData({ fijas: [], guias: [] }))
    return () => {
      cancelled = true
    }
  }, [version])

  const createGuide = async () => {
    setCreating(true)
    try {
      const res = await api.post<{ data: HelpPage }>("/pages/admin/guides", { titulo: "Nueva guía" })
      router.push(`/content/pages/guias/${res.data.data.slug}`)
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo crear la guía"))
      setCreating(false)
    }
  }

  const reorder = async (guias: GuideSummary[]) => {
    setData((d) => d && { ...d, guias })
    await api.put("/pages/admin/guides/order", { ids: guias.map((g) => g.id) }).catch(() => toast.error("No se pudo guardar el orden"))
  }

  const togglePublish = async (g: GuideSummary) => {
    try {
      const full = await api.get<{ data: HelpPage }>(`/pages/admin/${g.slug}`)
      const p = full.data.data
      await api.put(`/pages/admin/guides/${g.id}`, { titulo: p.titulo, resumen: p.resumen, portadaUrl: p.portadaUrl, bloques: p.bloques, publicado: !g.publicado })
      setData((d) => d && { ...d, guias: d.guias.map((x) => (x.id === g.id ? { ...x, publicado: !g.publicado } : x)) })
      toast.success(g.publicado ? "Guía ocultada" : "Guía publicada")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo cambiar"))
    }
  }

  const remove = async (g: GuideSummary) => {
    const ok = await confirmAction({ title: `¿Eliminar "${g.titulo}"?`, description: "La guía deja de verse en la tienda.", confirmText: "Eliminar", destructive: true })
    if (!ok) return
    try {
      await api.delete(`/pages/admin/guides/${g.id}`)
      setData((d) => d && { ...d, guias: d.guias.filter((x) => x.id !== g.id) })
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar"))
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Páginas de ayuda"
        description="Las páginas del pie de la tienda (Ayuda). Vienen con una plantilla lista: edítalas cuando quieras. ¿Cómo comprar? funciona como un blog con guías y videos."
        storePath="/ayuda/como-comprar"
      />

      {!data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Páginas" description="Se muestran en el pie de página, en la columna Ayuda.">
            <ul className="divide-y rounded-xl border">
              {data.fijas.map((p) => {
                const Icon = ICONS[p.slug] ?? FileText
                return (
                  <li key={p.slug} className="flex items-center gap-3 px-3 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-strong dark:text-brand-bright">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p.titulo}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.plantilla ? "Plantilla incluida" : `Personalizada · ${p.actualizado ? dateFormat.format(new Date(p.actualizado)) : ""}`}
                      </span>
                    </span>
                    <Button variant="ghost" size="icon-sm" aria-label={`Ver ${p.titulo} en la tienda`} render={<a href={`${STORE_URL}${storePath(p)}`} target="_blank" rel="noreferrer" />} nativeButton={false}>
                      <ExternalLink className="size-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" render={<Link href={`/content/pages/${p.slug}`} />} nativeButton={false}>
                      <Pencil className="size-3.5" /> Editar
                    </Button>
                  </li>
                )
              })}
            </ul>
          </Section>

          <Section
            title="Guías de ¿Cómo comprar?"
            description="Artículos del blog con texto, imágenes y videos. Aparecen debajo de la página ¿Cómo comprar?, en este orden."
            aside={
              <Button size="sm" onClick={createGuide} disabled={creating}>
                {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                Nueva guía
              </Button>
            }
          >
            {data.guias.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Aún no hay guías. Crea una, por ejemplo &quot;Cómo pagar con Yape&quot; o &quot;Cómo ver mis accesos&quot;, y agrégale un video.
              </div>
            ) : (
              <ul className="divide-y rounded-xl border">
                {data.guias.map((g, i) => (
                  <li key={g.id} className="flex items-center gap-3 px-3 py-3">
                    <span className="flex flex-col">
                      <button type="button" aria-label={`Subir ${g.titulo}`} disabled={i === 0} onClick={() => reorder(moveItem(data.guias, i, -1))} className={MOVE}>
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button type="button" aria-label={`Bajar ${g.titulo}`} disabled={i === data.guias.length - 1} onClick={() => reorder(moveItem(data.guias, i, 1))} className={MOVE}>
                        <ArrowDown className="size-3.5" />
                      </button>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {g.video && <PlayCircle className="size-3.5 shrink-0 text-brand-strong dark:text-brand-bright" aria-label="Con video" />}
                        {g.titulo}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">/ayuda/como-comprar/{g.slug}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePublish(g)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        g.publicado ? "bg-brand/15 text-brand-strong dark:text-brand-bright" : "bg-muted text-muted-foreground"
                      )}
                      title={g.publicado ? "Clic para ocultar" : "Clic para publicar"}
                    >
                      {g.publicado ? "Publicada" : "Borrador"}
                    </button>
                    <Button variant="outline" size="sm" render={<Link href={`/content/pages/guias/${g.slug}`} />} nativeButton={false}>
                      <Pencil className="size-3.5" /> Editar
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={`Eliminar ${g.titulo}`} onClick={() => remove(g)}>
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </div>
  )
}
