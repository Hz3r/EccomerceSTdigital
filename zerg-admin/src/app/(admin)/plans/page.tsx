"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
} from "@/components/data-table/data-table"
import api from "@/lib/axios"
import { formatPrice } from "@/lib/format"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react"
import type { Plan, Product } from "@/types"

export default function PlansPage() {
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const [formNombre, setFormNombre] = React.useState("")
  const [formSlug, setFormSlug] = React.useState("")
  const [formDuracion, setFormDuracion] = React.useState("")
  const [formPrecio, setFormPrecio] = React.useState("")
  const [formPrecioOriginal, setFormPrecioOriginal] = React.useState("")
  const [formDescripcion, setFormDescripcion] = React.useState("")
  const [formProductId, setFormProductId] = React.useState("")

  const fetchData = React.useCallback(async () => {
    try {
      const [planRes, prodRes] = await Promise.all([
        api.get("/plans"),
        api.get("/products"),
      ])
      setPlans(planRes.data.data)
      setProducts(prodRes.data.data)
    } catch {} finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  const handleToggleStatus = async (plan: Plan) => {
    try {
      await api.put(`/plans/${plan.id}`, { isActivo: !plan.isActivo })
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActivo: !p.isActivo } : p))
      )
    } catch {}
  }

  const openCreate = () => {
    setEditingPlan(null)
    setFormNombre("")
    setFormSlug("")
    setFormDuracion("")
    setFormPrecio("")
    setFormPrecioOriginal("")
    setFormDescripcion("")
    setFormProductId("")
    setOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormNombre(plan.nombre)
    setFormSlug(plan.slug)
    setFormDuracion(plan.duracion)
    setFormPrecio(String(plan.precio))
    setFormPrecioOriginal(plan.precioOriginal ? String(plan.precioOriginal) : "")
    setFormDescripcion(plan.descripcion ?? "")
    setFormProductId(plan.productId)
    setOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        nombre: formNombre,
        slug: formSlug,
        duracion: formDuracion,
        precio: parseFloat(formPrecio),
        precioOriginal: formPrecioOriginal ? parseFloat(formPrecioOriginal) : undefined,
        descripcion: formDescripcion || undefined,
        productId: formProductId,
      }

      if (editingPlan) {
        const res = await api.put(`/plans/${editingPlan.id}`, payload)
        setPlans((prev) =>
          prev.map((p) => (p.id === editingPlan.id ? { ...p, ...res.data.data } : p))
        )
      } else {
        const res = await api.post("/plans", payload)
        setPlans((prev) => [res.data.data, ...prev])
      }
      setOpen(false)
    } catch {} finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (plan: Plan) => {
    if (!window.confirm(`¿Eliminar el plan "${plan.nombre}"?`)) return
    try {
      await api.delete(`/plans/${plan.id}`)
      setPlans((prev) => prev.filter((p) => p.id !== plan.id))
    } catch {}
  }

  const columns: DataTableColumn<Plan>[] = [
    { key: "nombre", label: "Nombre" },
    {
      key: "productId",
      label: "Producto",
      hideOnMobile: true,
      render: (item) => {
        const prod = products.find((p) => p.id === item.productId)
        return <span>{prod?.nombre ?? "—"}</span>
      },
    },
    { key: "duracion", label: "Duración", hideOnMobile: true },
    {
      key: "precio",
      label: "Precio",
      render: (item) => <span className="font-medium">{formatPrice(item.precio)}</span>,
    },
    {
      key: "precioOriginal",
      label: "Precio Original",
      render: (item) =>
        item.precioOriginal ? (
          <span className="text-muted-foreground line-through">{formatPrice(item.precioOriginal ?? 0)}</span>
        ) : (
          "-"
        ),
    },
    {
      key: "isActivo",
      label: "Estado",
      render: (item) => (
        <Badge
          variant={item.isActivo ? "default" : "secondary"}
          className="cursor-pointer select-none"
          onClick={(e) => { e.stopPropagation(); handleToggleStatus(item) }}
        >
          {item.isActivo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ]

  const actions: DataTableAction<Plan>[] = [
    { label: "Editar", icon: <PencilIcon className="size-3.5" />, onClick: (item) => openEdit(item) },
    { label: "Eliminar", icon: <TrashIcon className="size-3.5" />, variant: "destructive", onClick: (item) => handleDelete(item) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Planes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona los planes y variantes de productos</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Nuevo Plan</span>
        </Button>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <DataTable
              data={plans as unknown as Record<string, unknown>[]}
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              actions={actions as unknown as DataTableAction<Record<string, unknown>>[]}
              searchPlaceholder="Buscar plan..."
              searchKey="nombre"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Modifica los datos del plan" : "Completa los datos para crear un plan"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" placeholder="Nombre del plan" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="slug-del-plan" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="producto">Producto</Label>
              <select
                id="producto"
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar producto</option>
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duracion">Duración</Label>
              <Input id="duracion" placeholder="Ej: 1 año" value={formDuracion} onChange={(e) => setFormDuracion(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="precio">Precio</Label>
                <Input id="precio" type="number" step="0.01" placeholder="0.00" value={formPrecio} onChange={(e) => setFormPrecio(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="precioOriginal">Precio Original</Label>
                <Input id="precioOriginal" type="number" step="0.01" placeholder="0.00" value={formPrecioOriginal} onChange={(e) => setFormPrecioOriginal(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input id="descripcion" placeholder="Descripción (opcional)" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Guardando..." : editingPlan ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
