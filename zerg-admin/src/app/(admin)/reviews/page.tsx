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
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  TrashIcon,
} from "lucide-react"
import type { Review } from "@/types"

const mockReviews: Review[] = [
  {
    id: "1",
    puntuacion: 5,
    comentario: "Excelente producto, muy recomendado",
    isApproved: true,
    productId: "1",
    userId: "1",
    creadoEn: "2024-01-15T10:00:00Z",
    actualizado: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    puntuacion: 4,
    comentario: "Buen producto pero el envío fue lento",
    isApproved: true,
    productId: "2",
    userId: "2",
    creadoEn: "2024-01-16T10:00:00Z",
    actualizado: "2024-01-16T10:00:00Z",
  },
  {
    id: "3",
    puntuacion: 3,
    comentario: "Producto regular",
    isApproved: false,
    productId: "3",
    userId: "3",
    creadoEn: "2024-01-17T10:00:00Z",
    actualizado: "2024-01-17T10:00:00Z",
  },
]

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>(mockReviews)

  const columns: DataTableColumn<Review>[] = [
    {
      key: "puntuacion",
      label: "Puntuación",
      render: (item) => (
        <div className="flex items-center gap-1">
          <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{item.puntuacion}</span>
        </div>
      ),
    },
    { key: "comentario", label: "Comentario" },
    {
      key: "isApproved",
      label: "Estado",
      render: (item) => (
        <Badge variant={item.isApproved ? "default" : "secondary"}>
          {item.isApproved ? "Aprobada" : "Pendiente"}
        </Badge>
      ),
    },
    {
      key: "creadoEn",
      label: "Fecha",
      render: (item) => (
        <span className="text-muted-foreground">
          {new Date(item.creadoEn).toLocaleDateString("es-ES")}
        </span>
      ),
    },
  ]

  const actions: DataTableAction<Review>[] = [
    {
      label: "Aprobar",
      icon: <CheckCircleIcon className="size-3.5" />,
      onClick: (item) => {
        setReviews((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, isApproved: true } : r))
        )
      },
      show: (item) => !item.isApproved,
    },
    {
      label: "Rechazar",
      icon: <XCircleIcon className="size-3.5" />,
      variant: "outline",
      onClick: (item) => {
        setReviews((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, isApproved: false } : r))
        )
      },
      show: (item) => item.isApproved,
    },
    {
      label: "Eliminar",
      icon: <TrashIcon className="size-3.5" />,
      variant: "destructive",
      onClick: (item) => {
        setReviews((prev) => prev.filter((r) => r.id !== item.id))
      },
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reseñas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona las reseñas de los productos
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <DataTable
            data={reviews as unknown as Record<string, unknown>[]}
            columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
            actions={actions as unknown as DataTableAction<Record<string, unknown>>[]}
            searchPlaceholder="Buscar reseña..."
            searchKey="comentario"
          />
        </CardContent>
      </Card>
    </div>
  )
}
