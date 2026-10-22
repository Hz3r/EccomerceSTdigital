"use client"

import * as React from "react"
import { CheckIcon, ExternalLink, ImageOff, Loader2, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/axios"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { EstadoPago, MetodoPago, Payment } from "@/types"

export const METODO_LABEL: Record<MetodoPago, string> = {
  DIRECTO: "Yape / Plin / transferencia",
  IZIPAY: "Tarjeta (Izipay)",
  BINANCE_PAY: "Binance Pay",
}

export const PAGO_META: Record<EstadoPago, { label: string; className: string }> = {
  PENDIENTE: { label: "Sin pagar", className: "bg-muted text-muted-foreground" },
  EN_REVISION: { label: "Por revisar", className: "bg-viz-warning/20 text-foreground" },
  PAGADO: { label: "Pagado", className: "bg-brand/15 text-brand-strong dark:text-brand-bright" },
  RECHAZADO: { label: "Rechazado", className: "bg-destructive/10 text-destructive" },
}

export function PaymentBadge({ payment }: { payment?: Payment | null }) {
  if (!payment) return <span className="text-xs text-muted-foreground">—</span>
  const meta = PAGO_META[payment.estado]
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className={cn("w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", meta.className)}>{meta.label}</span>
      <span className="text-[11px] text-muted-foreground">{METODO_LABEL[payment.metodo]}</span>
    </span>
  )
}

// El comprobante es privado: se pide con la sesión del admin y se muestra como imagen local.
function ProofImage({ paymentId }: { paymentId: string }) {
  const [url, setUrl] = React.useState("")
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    let objectUrl = ""
    let cancelled = false
    api
      .get(`/payments/${paymentId}/proof`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data as Blob)
        setUrl(objectUrl)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [paymentId])

  if (failed) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-xs text-muted-foreground">
        <ImageOff className="size-5" /> No se pudo cargar el comprobante
      </div>
    )
  }
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-xl border bg-muted/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Comprobante de pago" className="max-h-72 w-full object-contain" />
      <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[11px] font-semibold opacity-0 shadow transition-opacity group-hover:opacity-100">
        <ExternalLink className="size-3" /> Ver en grande
      </span>
    </a>
  )
}

/** Pago de la orden en el detalle: comprobante y botones para confirmar o rechazar el pago directo. */
export function PaymentReview({ payment, total }: { payment?: Payment | null; total: number }) {
  const [busy, setBusy] = React.useState<"aprobar" | "rechazar" | null>(null)
  const [rejecting, setRejecting] = React.useState(false)
  const [motivo, setMotivo] = React.useState("")
  const [error, setError] = React.useState("")

  if (!payment) {
    return <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">Esta orden no tiene un pago registrado (pedido anterior a las pasarelas).</p>
  }

  const review = async (aprobar: boolean) => {
    setBusy(aprobar ? "aprobar" : "rechazar")
    setError("")
    try {
      await api.post(`/payments/${payment.id}/review`, aprobar ? { aprobar: true } : { aprobar: false, motivo })
      setRejecting(false)
      setMotivo("")
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "No se pudo actualizar el pago")
    } finally {
      setBusy(null)
    }
  }

  const canReview = payment.metodo === "DIRECTO" && (payment.estado === "EN_REVISION" || payment.estado === "PENDIENTE")

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Pago</p>
          <p className="font-semibold">{METODO_LABEL[payment.metodo]}</p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(Number(payment.monto ?? total))}
            {payment.referencia && <> · Op. <span className="font-mono">{payment.referencia}</span></>}
          </p>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", PAGO_META[payment.estado].className)}>{PAGO_META[payment.estado].label}</span>
      </div>

      {payment.estado === "RECHAZADO" && payment.motivoRechazo && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">Motivo: {payment.motivoRechazo}</p>
      )}

      {payment.tieneComprobante && <ProofImage paymentId={payment.id} />}

      {payment.metodo === "DIRECTO" && payment.estado === "PENDIENTE" && (
        <p className="text-xs text-muted-foreground">El cliente aún no sube su comprobante. Si ya viste el pago en tu app, puedes confirmarlo igual.</p>
      )}

      {canReview && !rejecting && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-lg" disabled={busy !== null} onClick={() => review(true)}>
            {busy === "aprobar" ? <Loader2 className="size-3.5 animate-spin" /> : <CheckIcon className="size-3.5" />}
            Confirmar pago
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg" disabled={busy !== null} onClick={() => setRejecting(true)}>
            <XIcon className="size-3.5" />
            Rechazar
          </Button>
        </div>
      )}

      {rejecting && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            review(false)
          }}
        >
          <Input autoFocus value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} placeholder="Motivo para el cliente (ej. el monto no coincide)" className="h-9" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="destructive" className="rounded-lg" disabled={busy !== null}>
              {busy === "rechazar" && <Loader2 className="size-3.5 animate-spin" />}
              Rechazar pago
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
