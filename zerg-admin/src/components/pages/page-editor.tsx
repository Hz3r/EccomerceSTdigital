"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Loader2, RotateCcw, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, SaveBar, Section, TextField, Toggle } from "@/components/cms/form"
import { ImageField } from "@/components/image-field"
import { BlocksEditor } from "@/components/pages/blocks-editor"
import { confirmAction, toast } from "@/components/feedback"
import api from "@/lib/axios"
import { STORE_URL } from "@/lib/format"
import { storePath, type HelpPage } from "@/lib/pages"

type Draft = Pick<HelpPage, "titulo" | "resumen" | "portadaUrl" | "bloques" | "publicado" | "slug">

const toDraft = (p: HelpPage): Draft => ({ titulo: p.titulo, resumen: p.resumen, portadaUrl: p.portadaUrl, bloques: p.bloques, publicado: p.publicado, slug: p.slug })
const errorMessage = (err: unknown, fallback: string) => (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback

const TOKENS_HINT = "Puedes escribir {tienda}, {whatsapp}, {email} y {horario}: la tienda los cambia por tus datos de Contenido del sitio."

/** Editor de una página de ayuda fija o de una guía del blog "¿Cómo comprar?". */
export function PageEditor({ slug, kind }: { slug: string; kind: "fixed" | "guide" }) {
  const router = useRouter()
  const [page, setPage] = React.useState<HelpPage | null>(null)
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [loadError, setLoadError] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")
  const [savedAt, setSavedAt] = React.useState<Date | null>(null)

  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: HelpPage }>(`/pages/admin/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (cancelled) return
        setPage(res.data.data)
        setDraft(toDraft(res.data.data))
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err, "No se pudo cargar la página")))
    return () => {
      cancelled = true
    }
  }, [slug])

  const dirty = Boolean(page && draft && JSON.stringify(toDraft(page)) !== JSON.stringify(draft))

  // Avisa antes de salir con cambios sin guardar
  React.useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  if (loadError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{loadError}</p>
      </div>
    )
  }
  if (!page || !draft) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => d && { ...d, ...patch })

  const save = async () => {
    setSaving(true)
    setError("")
    try {
      const body = { titulo: draft.titulo, resumen: draft.resumen, portadaUrl: draft.portadaUrl, bloques: draft.bloques, publicado: draft.publicado, slug: draft.slug }
      const res =
        kind === "fixed"
          ? await api.put<{ data: HelpPage }>(`/pages/admin/fixed/${page.slug}`, body)
          : await api.put<{ data: HelpPage }>(`/pages/admin/guides/${page.id}`, body)
      setPage(res.data.data)
      setDraft(toDraft(res.data.data))
      setSavedAt(new Date())
      if (res.data.data.slug !== slug) router.replace(`/content/pages/guias/${res.data.data.slug}`)
    } catch (err) {
      setError(errorMessage(err, "No se pudo guardar"))
    } finally {
      setSaving(false)
    }
  }

  const restore = async () => {
    const ok = await confirmAction({
      title: "¿Restaurar la plantilla?",
      description: "Se reemplaza el contenido de esta página por la plantilla incluida. Lo que escribiste se perderá.",
      confirmText: "Restaurar",
      destructive: true,
    })
    if (!ok) return
    try {
      const res = await api.delete<{ data: HelpPage }>(`/pages/admin/fixed/${page.slug}`)
      setPage(res.data.data)
      setDraft(toDraft(res.data.data))
      toast.success("Plantilla restaurada")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo restaurar"))
    }
  }

  const remove = async () => {
    const ok = await confirmAction({ title: `¿Eliminar "${page.titulo}"?`, description: "La guía deja de verse en la tienda.", confirmText: "Eliminar", destructive: true })
    if (!ok) return
    try {
      await api.delete(`/pages/admin/guides/${page.id}`)
      toast.success("Guía eliminada")
      router.push("/content/pages")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar"))
    }
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{draft.titulo || "Sin título"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {kind === "fixed" ? (page.plantilla ? "Mostrando la plantilla incluida. Edítala y guarda para personalizarla." : "Página personalizada.") : draft.publicado ? "Guía publicada en ¿Cómo comprar?" : "Borrador: no se ve en la tienda."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {kind === "fixed" && !page.plantilla && (
            <Button variant="outline" size="sm" onClick={restore}>
              <RotateCcw className="size-3.5" /> Restaurar plantilla
            </Button>
          )}
          {kind === "guide" && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={remove}>
              <TrashIcon className="size-3.5" /> Eliminar
            </Button>
          )}
          <Button variant="outline" size="sm" render={<a href={`${STORE_URL}${storePath(page)}`} target="_blank" rel="noreferrer" />} nativeButton={false}>
            <ExternalLink className="size-3.5" /> Ver en la tienda
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Section title="Contenido" description="Arma la página con bloques. Usa las flechas para cambiar el orden.">
          <BlocksEditor blocks={draft.bloques} onChange={(bloques) => set({ bloques })} />
        </Section>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Section title="Datos de la página">
            <TextField id="page-titulo" label="Título" value={draft.titulo} onChange={(titulo) => set({ titulo })} />
            <TextField id="page-resumen" label="Resumen" multiline value={draft.resumen} onChange={(resumen) => set({ resumen })} hint="Se muestra bajo el título y en la tarjeta de la guía." />
            {kind === "guide" && (
              <>
                <Field label="Enlace" htmlFor="page-slug" hint={`${STORE_URL}/ayuda/como-comprar/${draft.slug}`}>
                  <Input id="page-slug" value={draft.slug} onChange={(e) => set({ slug: e.target.value })} />
                </Field>
                <Toggle label="Publicada" hint="Visible en ¿Cómo comprar?" checked={draft.publicado} onChange={(publicado) => set({ publicado })} />
              </>
            )}
            <Field label="Imagen de portada (opcional)" hint={kind === "guide" ? "Se usa en la tarjeta del blog." : undefined}>
              <ImageField value={draft.portadaUrl} onChange={(portadaUrl) => set({ portadaUrl })} folder="general" />
            </Field>
          </Section>

          <Section title="Formato del texto">
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>Línea en blanco = nuevo párrafo.</li>
              <li>
                <code className="rounded bg-muted px-1">- elemento</code> = lista con viñetas.
              </li>
              <li>
                <code className="rounded bg-muted px-1">**texto**</code> = <b className="text-foreground">negrita</b>.
              </li>
              <li>
                <code className="rounded bg-muted px-1">[texto](https://…)</code> = enlace.
              </li>
              <li>{TOKENS_HINT}</li>
            </ul>
            {kind === "fixed" && ["terminos", "privacidad", "garantia"].includes(page.slug) && (
              <p className="rounded-lg bg-viz-warning/10 p-2.5 text-xs">Es una plantilla general: revisa que los textos legales correspondan a tu negocio.</p>
            )}
          </Section>
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} savedAt={savedAt} error={error} onSave={save} onDiscard={() => setDraft(toDraft(page))} />
    </div>
  )
}

function BackLink() {
  return (
    <Link href="/content/pages" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Páginas de ayuda
    </Link>
  )
}
