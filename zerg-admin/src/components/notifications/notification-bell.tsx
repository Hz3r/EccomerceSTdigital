"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BadgeDollarSign, BellIcon, CheckCheck, MessageSquareQuote, ShoppingCartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import api from "@/lib/axios"
import { useLiveVersion } from "@/lib/live"
import { timeAgo } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { AdminStats, AppNotification, NotificationList, TipoNotificacion } from "@/types"

type Tab = "TODAS" | Extract<TipoNotificacion, "COMPRA" | "VENTA" | "RESENA">

const TABS: { id: Tab; label: string }[] = [
  { id: "TODAS", label: "Todas" },
  { id: "COMPRA", label: "Compras" },
  { id: "VENTA", label: "Ventas" },
  { id: "RESENA", label: "Reseñas" },
]

const ICONS: Record<TipoNotificacion, typeof BellIcon> = {
  COMPRA: ShoppingCartIcon,
  VENTA: BadgeDollarSign,
  PEDIDO: ShoppingCartIcon,
  RESENA: MessageSquareQuote,
}

const EMPTY: Record<Tab, string> = {
  TODAS: "Aquí aparecerán las nuevas compras, ventas y reseñas.",
  COMPRA: "Cuando un cliente compre, verás aquí la orden.",
  VENTA: "Las órdenes que marques como completadas aparecerán aquí.",
  RESENA: "Las reseñas nuevas por aprobar aparecerán aquí.",
}

// Campana del panel: órdenes de compra nuevas, ventas completadas y reseñas, con leídas/no leídas y en vivo.
export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<Tab>("TODAS")
  const [data, setData] = React.useState<NotificationList | null>(null)
  const [pending, setPending] = React.useState({ orders: 0, reviews: 0 })
  const version = useLiveVersion("notifications", "orders", "reviews")

  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: NotificationList }>("/notifications", { params: { limit: 30, ...(tab !== "TODAS" && { tipo: tab }) } })
      .then((res) => !cancelled && setData(res.data.data))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [tab, version])

  // Pendientes reales (no avisos): pedidos por entregar y reseñas por aprobar.
  React.useEffect(() => {
    api
      .get<{ data: AdminStats }>("/admin/stats")
      .then((res) => setPending({ orders: res.data.data.pendingOrders, reviews: res.data.data.pendingReviews ?? 0 }))
      .catch(() => {})
  }, [version])

  const unread = data?.unread ?? 0
  const unreadIn = (t: Tab) => (t === "TODAS" ? unread : data?.unreadByTipo[t] ?? 0)

  const markRead = (n: AppNotification) => {
    if (n.leida) return
    setData((d) =>
      d && {
        ...d,
        items: d.items.map((x) => (x.id === n.id ? { ...x, leida: true } : x)),
        unread: Math.max(0, d.unread - 1),
        unreadByTipo: { ...d.unreadByTipo, [n.tipo]: Math.max(0, d.unreadByTipo[n.tipo] - 1) },
      }
    )
    api.patch(`/notifications/${n.id}/read`).catch(() => {})
  }

  const markAllRead = () => {
    setData((d) => {
      if (!d) return d
      const unreadByTipo = { ...d.unreadByTipo }
      if (tab === "TODAS") (Object.keys(unreadByTipo) as TipoNotificacion[]).forEach((k) => (unreadByTipo[k] = 0))
      else unreadByTipo[tab] = 0
      return {
        items: d.items.map((x) => ({ ...x, leida: true })),
        unreadByTipo,
        unread: Object.values(unreadByTipo).reduce((a, b) => a + b, 0),
      }
    })
    api.post("/notifications/read-all", null, { params: tab !== "TODAS" ? { tipo: tab } : {} }).catch(() => {})
  }

  const go = (n: AppNotification) => {
    markRead(n)
    setOpen(false)
    if (n.href) router.push(n.href)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative size-10" />}
        aria-label={unread > 0 ? `Notificaciones (${unread} sin leer)` : "Notificaciones"}
      >
        <BellIcon className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-bold text-brand-ink">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          <PopoverTitle className="text-sm font-bold">Notificaciones</PopoverTitle>
          {unreadIn(tab) > 0 && (
            <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline dark:text-brand-bright">
              <CheckCheck className="size-3.5" />
              Marcar como leídas
            </button>
          )}
        </div>

        <div role="tablist" aria-label="Tipo de notificación" className="flex gap-1 border-b px-3 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                tab === t.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {unreadIn(t.id) > 0 && (
                <span className="rounded-full bg-brand/20 px-1.5 text-[10px] text-brand-strong dark:text-brand-bright">{unreadIn(t.id)}</span>
              )}
            </button>
          ))}
        </div>

        {(pending.orders > 0 || pending.reviews > 0) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-b bg-muted/40 px-4 py-2 text-xs">
            <span className="font-semibold text-muted-foreground">Pendientes:</span>
            {pending.orders > 0 && (
              <Link href="/orders" onClick={() => setOpen(false)} className="font-medium hover:underline">
                {pending.orders} {pending.orders === 1 ? "pedido por entregar" : "pedidos por entregar"}
              </Link>
            )}
            {pending.reviews > 0 && (
              <Link href="/reviews" onClick={() => setOpen(false)} className="font-medium hover:underline">
                {pending.reviews} {pending.reviews === 1 ? "reseña por aprobar" : "reseñas por aprobar"}
              </Link>
            )}
          </div>
        )}

        <div role="tabpanel">
          {!data ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : data.items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <BellIcon className="mx-auto size-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">Todo al día</p>
              <p className="mt-1 text-xs text-muted-foreground">{EMPTY[tab]}</p>
            </div>
          ) : (
            <ul className="scrollbar-thin max-h-[min(26rem,65vh)] divide-y overflow-y-auto">
              {data.items.map((n) => {
                const Icon = ICONS[n.tipo]
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => go(n)}
                      className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted", !n.leida && "bg-brand/5")}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          n.tipo === "VENTA" ? "bg-viz-good/15 text-viz-good" : "bg-brand/15 text-brand-strong dark:text-brand-bright"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate text-sm", n.leida ? "font-medium" : "font-bold")}>{n.titulo}</span>
                          {!n.leida && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Sin leer" />}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.mensaje}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/80">{timeAgo(n.creadoEn)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
