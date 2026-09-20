"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
} from "@/components/data-table/data-table"
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  ClockIcon,
} from "lucide-react"
import type { Order, StatusOrden } from "@/types"

const statusConfig: Record<StatusOrden, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  PENDIENTE: { label: "Pendiente", variant: "outline", icon: <ClockIcon className="size-3" /> },
  ENVIADO: { label: "Enviado", variant: "secondary", icon: <TruckIcon className="size-3" /> },
  COMPLETADO: { label: "Completado", variant: "default", icon: <CheckCircleIcon className="size-3" /> },
  CANCELADO: { label: "Cancelado", variant: "destructive", icon: <XCircleIcon className="size-3" /> },
}

const mockOrders: Order[] = [
  {
    id: "1",
    numeroOrden: "ORD-001",
    nombreCliente: "Juan Pérez",
    email: "juan@email.com",
    telefono: "+1234567890",
    status: "PENDIENTE",
    total: 1999.98,
    creadoEn: "2024-01-15T10:00:00Z",
    actualizado: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    numeroOrden: "ORD-002",
    nombreCliente: "María García",
    email: "maria@email.com",
    telefono: "+0987654321",
    status: "ENVIADO",
    total: 899.99,
    creadoEn: "2024-01-16T10:00:00Z",
    actualizado: "2024-01-16T10:00:00Z",
  },
  {
    id: "3",
    numeroOrden: "ORD-003",
    nombreCliente: "Carlos López",
    email: "carlos@email.com",
    status: "COMPLETADO",
    total: 1199.99,
    creadoEn: "2024-01-17T10:00:00Z",
    actualizado: "2024-01-17T10:00:00Z",
  },
  {
    id: "4",
    numeroOrden: "ORD-004",
    nombreCliente: "Ana Martínez",
    email: "ana@email.com",
    status: "CANCELADO",
    total: 999.99,
    creadoEn: "2024-01-18T10:00:00Z",
    actualizado: "2024-01-18T10:00:00Z",
  },
]

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>(mockOrders)

  const columns: DataTableColumn<Order>[] = [
    { key: "numeroOrden", label: "N° Orden" },
    { key: "nombreCliente", label: "Cliente" },
    { key: "email", label: "Email", hideOnMobile: true },
    {
      key: "status",
      label: "Estado",
      render: (item) => {
        const config = statusConfig[item.status]
        return (
          <Badge variant={config.variant}>
            {config.icon}
            {config.label}
          </Badge>
        )
      },
    },
    {
      key: "total",
      label: "Total",
      render: (item) => (
        <span className="font-medium">${item.total.toFixed(2)}</span>
      ),
    },
    {
      key: "creadoEn",
      label: "Fecha",
      hideOnMobile: true,
      render: (item) => (
        <span className="text-muted-foreground">
          {new Date(item.creadoEn).toLocaleDateString("es-ES")}
        </span>
      ),
    },
  ]

  const actions: DataTableAction<Order>[] = [
    {
      label: "Ver",
      icon: <EyeIcon className="size-3.5" />,
      onClick: (item) => console.log("Ver orden", item),
    },
    {
      label: "Editar",
      icon: <PencilIcon className="size-3.5" />,
      onClick: (item) => console.log("Editar orden", item),
    },
    {
      label: "Eliminar",
      icon: <TrashIcon className="size-3.5" />,
      variant: "destructive",
      onClick: (item) => {
        setOrders((prev) => prev.filter((o) => o.id !== item.id))
      },
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Órdenes</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona las órdenes de tu tienda
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <DataTable
            data={orders as unknown as Record<string, unknown>[]}
            columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
            actions={actions as unknown as DataTableAction<Record<string, unknown>>[]}
            searchPlaceholder="Buscar por número de orden o cliente..."
            searchKey="numeroOrden"
          />
        </CardContent>
      </Card>
    </div>
  )
}
