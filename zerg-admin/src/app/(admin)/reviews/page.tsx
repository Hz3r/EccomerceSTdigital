"use client"

import * as React from "react"
import { CheckIcon, EyeOffIcon, Loader2, MessageSquareReply, PencilIcon, Star, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLiveVersion } from "@/lib/live"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import type { Review } from "@/types"

type Filter = "pendientes" | "sin-responder" | "aprobadas" | "todas"
const MAX_REPLY = 1000
const date = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" })

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<Filter>("pendientes")

  // Se actualiza en vivo con los cambios de la tienda y de otras pestañas
  const liveVersion = useLiveVersion("reviews")

  React.useEffect(() => {
    api
      .get("/reviews")
      .then((res) => {
        const data: Review[] = res.data.data
        setReviews(data)
        // Si no hay nada por moderar se muestran todas
        if (!data.some((r) => !r.isApproved)) setFilter("todas")
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [liveVersion])

  const setApproved = async (review: Review, isApproved: boolean) => {
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, isApproved } : r)))
    try {
      await api.patch(`/reviews/${review.id}/approve`, { isApproved })
    } catch {
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, isApproved: !isApproved } : r)))
    }
  }

  const remove = async (review: Review) => {
    if (!window.confirm("¿Eliminar esta reseña definitivamente?")) return
    try {
      await api.delete(`/reviews/${review.id}`)
      setReviews((prev) => prev.filter((r) => r.id !== review.id))
    } catch {
      window.alert("No se pudo eliminar la reseña")
    }
  }

  // Guarda (o con texto vacío, quita) la respuesta pública de la tienda.
  const saveReply = async (review: Review, respuesta: string) => {
    const res = await api.patch<{ data: Review }>(`/reviews/${review.id}/reply`, { respuesta })
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, respuesta: res.data.data.respuesta, respondidoEn: res.data.data.respondidoEn } : r))
    )
  }

  const pending = reviews.filter((r) => !r.isApproved).length
  const unanswered = reviews.filter((r) => !r.respuesta).length
  const visible = reviews.filter((r) =>
    filter === "todas" ? true : filter === "pendientes" ? !r.isApproved : filter === "sin-responder" ? !r.respuesta : r.isApproved
  )
  const average = reviews.length ? reviews.reduce((s, r) => s + r.puntuacion, 0) / reviews.length : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reseñas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo las reseñas aprobadas se muestran en la tienda (portada y página de cada producto).
          </p>
        </div>
        {reviews.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Promedio <b className="text-foreground">{average.toFixed(1)}</b> / 5 · {reviews.length} reseñas
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar reseñas">
        {(
          [
            ["pendientes", `Por aprobar (${pending})`],
            ["sin-responder", `Sin responder (${unanswered})`],
            ["aprobadas", `Aprobadas (${reviews.length - pending})`],
            ["todas", `Todas (${reviews.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filter === id ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground/30"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {filter === "pendientes"
            ? "No hay reseñas por aprobar. ¡Todo al día!"
            : filter === "sin-responder"
              ? "Todas las reseñas tienen respuesta."
              : "Aún no hay reseñas."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <article key={r.id} className="flex flex-col rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5" aria-label={`${r.puntuacion} de 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn("size-4", i < r.puntuacion ? "fill-brand-yellow text-brand-yellow" : "text-muted-foreground/30")}
                    />
                  ))}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    r.isApproved ? "bg-brand/15 text-brand-strong dark:text-brand-bright" : "bg-viz-warning/15 text-foreground"
                  )}
                >
                  {r.isApproved ? "Publicada" : "Por aprobar"}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed">{r.comentario || <i className="text-muted-foreground">Sin comentario</i>}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                <b className="text-foreground">{r.user?.nombre ?? "Cliente"}</b> sobre {r.product?.nombre ?? "un producto"} ·{" "}
                {date.format(new Date(r.creadoEn))}
              </p>
              <ReplyBox review={r} onSave={(text) => saveReply(r, text)} />
              <div className="mt-4 flex gap-2 border-t pt-4">
                {r.isApproved ? (
                  <Button variant="outline" size="sm" onClick={() => setApproved(r, false)}>
                    <EyeOffIcon className="size-3.5" />
                    Ocultar
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setApproved(r, true)}>
                    <CheckIcon className="size-3.5" />
                    Aprobar
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => remove(r)}>
                  <TrashIcon className="size-3.5" />
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// Respuesta pública de la tienda: se muestra bajo la reseña en la página del producto.
function ReplyBox({ review, onSave }: { review: Review; onSave: (text: string) => Promise<void> }) {
  const [editing, setEditing] = React.useState(false)
  const [text, setText] = React.useState(review.respuesta ?? "")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const save = async (value: string) => {
    setSaving(true)
    setError("")
    try {
      await onSave(value)
      setEditing(false)
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "No se pudo guardar la respuesta")
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <form
        className="mt-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          save(text)
        }}
      >
        <label htmlFor={`reply-${review.id}`} className="text-xs font-semibold">
          Respuesta de la tienda
        </label>
        <textarea
          id={`reply-${review.id}`}
          autoFocus
          rows={3}
          maxLength={MAX_REPLY}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Gracias por tu opinión…"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span role="alert" className="text-destructive">{error}</span>
          <span>
            {text.length}/{MAX_REPLY}
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={saving || !text.trim()}>
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            Publicar respuesta
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setText(review.respuesta ?? "")
              setError("")
              setEditing(false)
            }}
          >
            Cancelar
          </Button>
        </div>
      </form>
    )
  }

  if (!review.respuesta) {
    return (
      <Button variant="outline" size="sm" className="mt-4 w-fit" onClick={() => setEditing(true)}>
        <MessageSquareReply className="size-3.5" />
        Responder
      </Button>
    )
  }

  return (
    <div className="mt-4 rounded-xl border-l-2 border-brand bg-muted/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">
          Tu respuesta
          {review.respondidoEn && <span className="font-normal text-muted-foreground"> · {date.format(new Date(review.respondidoEn))}</span>}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Editar respuesta"
            onClick={() => {
              setText(review.respuesta ?? "")
              setEditing(true)
            }}
            className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <PencilIcon className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Quitar respuesta"
            disabled={saving}
            onClick={() => window.confirm("¿Quitar la respuesta de esta reseña?") && save("")}
            className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive"
          >
            <TrashIcon className="size-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm whitespace-pre-line">{review.respuesta}</p>
      {!review.isApproved && <p className="mt-1 text-[11px] text-muted-foreground">Se mostrará cuando apruebes la reseña.</p>}
    </div>
  )
}
