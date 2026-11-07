"use client"

import * as React from "react"
import { DownloadIcon, MailIcon, TrashIcon, UserCheckIcon, UserXIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type DataTableAction, type DataTableColumn } from "@/components/data-table/data-table"
import { useLiveVersion } from "@/lib/live"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"
import type { Subscriber } from "@/types"

type Filtro = "todos" | "activos" | "bajas"

const fecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" })

// Suscriptores del boletín (formulario "Suscríbete a nuestro boletín" de la tienda).
export default function SubscribersPage() {
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filtro, setFiltro] = React.useState<Filtro>("todos")
  const [exporting, setExporting] = React.useState(false)

  const liveVersion = useLiveVersion("subscribers")
  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: { subscribers: Subscriber[] } }>("/newsletter")
      .then((res) => {
        if (!cancelled) setSubscribers(res.data.data.subscribers)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [liveVersion])

  const activos = subscribers.filter((s) => s.activo).length
  const visibles = subscribers.filter((s) => (filtro === "activos" ? s.activo : filtro === "bajas" ? !s.activo : true))

  const toggle = async (s: Subscriber) => {
    try {
      await api.patch(`/newsletter/${s.id}`, { activo: !s.activo })
      setSubscribers((prev) => prev.map((x) => (x.id === s.id ? { ...x, activo: !x.activo } : x)))
    } catch {
      // error manejado por el interceptor
    }
  }

  const remove = async (s: Subscriber) => {
    if (!window.confirm(`¿Eliminar a ${s.email} de la lista? Si solo no quiere recibir correos, mejor dalo de baja.`)) return
    try {
      await api.delete(`/newsletter/${s.id}`)
      setSubscribers((prev) => prev.filter((x) => x.id !== s.id))
    } catch {
      // error manejado por el interceptor
    }
  }

  // El CSV necesita el token del admin, por eso se descarga con la API y no con un enlace directo.
  const exportCsv = async (todos: boolean) => {
    setExporting(true)
    try {
      const res = await api.get("/newsletter/export", { params: todos ? { todos: 1 } : {}, responseType: "blob" })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `suscriptores-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // error manejado por el interceptor
    } finally {
      setExporting(false)
    }
  }

  const columns: DataTableColumn<Subscriber>[] = [
    { key: "nombre", label: "Nombre" },
    { key: "email", label: "Correo" },
    {
      key: "activo",
      label: "Estado",
      render: (s) => <Badge variant={s.activo ? "default" : "secondary"}>{s.activo ? "Suscrito" : "De baja"}</Badge>,
    },
    { key: "creadoEn", label: "Desde", hideOnMobile: true, render: (s) => fecha.format(new Date(s.creadoEn)) },
  ]

  const actions: DataTableAction<Subscriber>[] = [
    {
      label: "Dar de baja",
      icon: <UserXIcon className="size-3.5" />,
      onClick: toggle,
      show: (s) => s.activo,
    },
    {
      label: "Reactivar",
      icon: <UserCheckIcon className="size-3.5" />,
      onClick: toggle,
      show: (s) => !s.activo,
    },
    {
      label: "Eliminar",
      icon: <TrashIcon className="size-3.5" />,
      variant: "destructive",
      onClick: remove,
    },
  ]

  const filtros: { id: Filtro; label: string; count: number }[] = [
    { id: "todos", label: "Todos", count: subscribers.length },
    { id: "activos", label: "Suscritos", count: activos },
    { id: "bajas", label: "De baja", count: subscribers.length - activos },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Suscriptores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personas que dejaron su correo en el boletín de la tienda. Exporta la lista para enviar tus campañas desde Mailchimp, Brevo u otro servicio.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(true)} disabled={exporting || subscribers.length === 0}>
            Exportar todos
          </Button>
          <Button size="sm" onClick={() => exportCsv(false)} disabled={exporting || activos === 0}>
            <DownloadIcon className="size-3.5" />
            Exportar suscritos (CSV)
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted",
              filtro === f.id && "border-primary bg-primary/10 text-primary"
            )}
          >
            {f.label} <span className="ml-1 tabular-nums text-muted-foreground">{f.count}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <MailIcon className="size-8" />
              <p>Aún no hay suscriptores.</p>
              <p className="text-xs">Aparecerán aquí cuando alguien use el formulario del boletín en la tienda.</p>
            </div>
          ) : (
            <DataTable
              data={visibles as unknown as Record<string, unknown>[]}
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              actions={actions as unknown as DataTableAction<Record<string, unknown>>[]}
              searchPlaceholder="Buscar por nombre o correo..."
              searchKey="nombre"
              searchKeys={["email"]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
