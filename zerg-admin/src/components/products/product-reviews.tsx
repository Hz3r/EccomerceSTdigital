"use client"

import * as React from "react"
import Link from "next/link"
import { CheckIcon, EyeOffIcon, Loader2, MessageSquareReply, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/axios"
import { useLiveVersion } from "@/lib/live"
import { cn } from "@/lib/utils"
import type { Review } from "@/types"

const date = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" })

/** Reseñas de un producto dentro de su ficha: promedio, aprobar u ocultar, e ir a responder. */
export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = React.useState<Review[] | null>(null)
  const version = useLiveVersion("reviews")

  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: Review[] }>("/reviews")
      .then((res) => !cancelled && setReviews(res.data.data.filter((r) => r.productId === productId)))
      .catch(() => !cancelled && setReviews([]))
    return () => {
      cancelled = true
    }
  }, [productId, version])

  const setApproved = async (review: Review, isApproved: boolean) => {
    setReviews((list) => list && list.map((r) => (r.id === review.id ? { ...r, isApproved } : r)))
    await api.patch(`/reviews/${review.id}/approve`, { isApproved }).catch(() => {
      setReviews((list) => list && list.map((r) => (r.id === review.id ? { ...r, isApproved: !isApproved } : r)))
    })
  }

  if (!reviews) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (reviews.length === 0) {
    return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Este producto aún no tiene reseñas.</p>
  }

  const approved = reviews.filter((r) => r.isApproved)
  const average = approved.length ? approved.reduce((s, r) => s + r.puntuacion, 0) / approved.length : 0

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <b className="text-foreground">{average ? average.toFixed(1) : "—"}</b> / 5 con {approved.length} publicada(s) · {reviews.length - approved.length} por aprobar
      </p>
      <ul className="space-y-2">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex gap-0.5" aria-label={`${r.puntuacion} de 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("size-3.5", i < r.puntuacion ? "fill-brand-yellow text-brand-yellow" : "text-muted-foreground/30")} />
                ))}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {r.user?.nombre ?? "Cliente"} · {date.format(new Date(r.creadoEn))}
              </span>
            </div>
            <p className="mt-2 text-sm">{r.comentario || <i className="text-muted-foreground">Sin comentario</i>}</p>
            {r.respuesta && <p className="mt-2 rounded-lg border-l-2 border-brand bg-muted/50 px-2.5 py-1.5 text-xs">Tu respuesta: {r.respuesta}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {r.isApproved ? (
                <Button size="sm" variant="outline" onClick={() => setApproved(r, false)}>
                  <EyeOffIcon className="size-3.5" /> Ocultar
                </Button>
              ) : (
                <Button size="sm" onClick={() => setApproved(r, true)}>
                  <CheckIcon className="size-3.5" /> Aprobar
                </Button>
              )}
              <Button size="sm" variant="ghost" render={<Link href="/reviews" />} nativeButton={false}>
                <MessageSquareReply className="size-3.5" /> {r.respuesta ? "Editar respuesta" : "Responder"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
