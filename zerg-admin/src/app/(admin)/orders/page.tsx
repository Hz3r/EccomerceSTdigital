"use client"

import * as React from "react"
import { EyeIcon, Loader2, Mail, MessageCircle, TrashIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DataTable, type DataTableAction, type DataTableColumn } from "@/components/data-table/data-table"
import { STATUS_META } from "@/components/charts/status-breakdown"
import api from "@/lib/axios"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Order, StatusOrden } from "@/types"

const STATUSES: StatusOrden[] = ["PENDIENTE", "ENVIADO", "COMPLETADO", "CANCELADO"]
const dateTime = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" })

function StatusSelect({ order, onChange }: { order: Order; onChange: (status: StatusOrden) => void }) {
  const meta = STATUS_META[order.status]
  return (
    <label className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <meta.icon className="pointer-events-none absolute left-2 size-3.5" style={{ color: meta.color }} />
      <span className="sr-only">Estado de la orden</span>
      <select
        value={order.status}
        onChange={(e) => onChange(e.target.value as StatusOrden)}
        className="h-8 cursor-pointer appearance-none rounded-lg border bg-background pr-3 pl-7 text-xs font-semibold"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s].label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<StatusOrden | "TODAS">("TODAS")
  const [detail, setDetail] = React.useState<Order | null>(null)

  React.useEffect(() => {
    api
      .get("/orders")
      .then((res) => setOrders(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const updateStatus = async (order: Order, status: StatusOrden) => {
    const previous = order.status
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
    setDetail((d) => (d?.id === order.id ? { ...d, status } : d))
    try {
      await api.patch(`/orders/${order.id}/status`, { status })
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: previous } : o)))
      window.alert("No se pudo cambiar el estado")
    }
  }

  const remove = async (order: Order) => {
    if (!window.confirm(`¿Eliminar la orden ${order.numeroOrden}?`)) return
    try {
      await api.delete(`/orders/${order.id}`)
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
    } catch {
      window.alert("No se pudo eliminar la orden")
    }
  }

  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
    {} as Record<StatusOrden, number>
  )
  const visible = filter === "TODAS" ? orders : orders.filter((o) => o.status === filter)

  const columns: DataTableColumn<Order>[] = [
    {
      key: "numeroOrden",
      label: "Orden",
      render: (o) => (
        <span>
          <span className="block font-mono text-xs font-semibold">{o.numeroOrden}</span>
          <span className="block text-[11px] text-muted-foreground">{dateTime.format(new Date(o.creadoEn))}</span>
        </span>
      ),
    },
    {
      key: "nombreCliente",
      label: "Cliente",
      render: (o) => (
        <span>
          <span className="block font-medium">{o.nombreCliente}</span>
          <span className="block text-[11px] text-muted-foreground">{o.email}</span>
        </span>
      ),
    },
    {
      key: "items",
      label: "Productos",
      hideOnMobile: true,
      render: (o) => (
        <span className="line-clamp-2 max-w-60 text-xs text-muted-foreground">
          {(o.items ?? []).map((i) => `${i.plan?.product?.nombre ?? i.plan?.nombre ?? "Plan"} ×${i.cantidad}`).join(", ") || "—"}
        </span>
      ),
    },
    { key: "total", label: "Total", render: (o) => <span className="font-semibold tabular-nums">{formatPrice(o.total)}</span> },
    { key: "status", label: "Estado", render: (o) => <StatusSelect order={o} onChange={(s) => updateStatus(o, s)} /> },
  ]

  const actions: DataTableAction<Order>[] = [
    { label: "Ver", icon: <EyeIcon className="size-3.5" />, onClick: (o) => setDetail(o) },
    { label: "Eliminar", icon: <TrashIcon className="size-3.5" />, variant: "destructive", onClick: (o) => remove(o) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Órdenes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cambia el estado a medida que entregas los accesos.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {(["TODAS", ...STATUSES] as const).map((s) => {
          const Icon = s === "TODAS" ? null : STATUS_META[s].icon
          return (
            <button
              key={s}
              type="button"
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                filter === s ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground/30"
              )}
            >
              {Icon && <Icon className="size-3.5" style={{ color: filter === s ? undefined : STATUS_META[s as StatusOrden].color }} />}
              {s === "TODAS" ? "Todas" : STATUS_META[s].label}
              <span className="tabular-nums opacity-70">{s === "TODAS" ? orders.length : counts[s]}</span>
            </button>
          )
        })}
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              data={visible as unknown as Record<string, unknown>[]}
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              actions={actions as unknown as DataTableAction<Record<string, unknown>>[]}
              searchPlaceholder="Buscar por cliente..."
              searchKey="nombreCliente"
              emptyMessage="No hay órdenes con este estado"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{detail.numeroOrden}</DialogTitle>
                <DialogDescription>{dateTime.format(new Date(detail.creadoEn))}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <span>
                    <span className="block font-semibold">{detail.nombreCliente}</span>
                    <span className="block text-xs text-muted-foreground">{detail.email}</span>
                    {detail.telefono && <span className="block text-xs text-muted-foreground">{detail.telefono}</span>}
                  </span>
                  <StatusSelect order={detail} onChange={(s) => updateStatus(detail, s)} />
                </div>
                <ul className="divide-y rounded-xl border">
                  {(detail.items ?? []).map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 px-3 py-2.5 text-sm">
                      <span>
                        {i.plan?.product?.nombre ?? "Producto"}{" "}
                        <span className="text-muted-foreground">
                          · {i.plan?.nombre} ×{i.cantidad}
                        </span>
                      </span>
                      <span className="tabular-nums">{formatPrice(Number(i.precioUnitario) * i.cantidad)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between px-3 py-2.5 text-sm font-bold">
                    <span>Total</span>
                    <span className="tabular-nums">{formatPrice(detail.total)}</span>
                  </li>
                </ul>
                {detail.notas && <p className="rounded-xl bg-muted p-3 text-sm">{detail.notas}</p>}
                <div className="flex flex-wrap gap-2">
                  {detail.telefono && (
                    <Button
                      className="rounded-xl"
                      render={
                        <a
                          href={`https://wa.me/${detail.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hola ${detail.nombreCliente}, te escribimos de ZERG por tu pedido ${detail.numeroOrden}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                      nativeButton={false}
                    >
                      <MessageCircle className="size-4" />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    render={<a href={`mailto:${detail.email}?subject=${encodeURIComponent(`Tu pedido ${detail.numeroOrden}`)}`} />}
                    nativeButton={false}
                  >
                    <Mail className="size-4" />
                    Correo
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
