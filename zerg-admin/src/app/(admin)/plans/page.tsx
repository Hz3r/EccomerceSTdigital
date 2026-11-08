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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
} from "@/components/data-table/data-table"
import { useLiveVersion } from "@/lib/live"
import api from "@/lib/axios"
import { formatPrice } from "@/lib/format"
import { ProfilesInput } from "@/components/products/profiles-input"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react"
import type { Plan, Product } from "@/types"
import { confirmAction, toast } from "@/components/feedback"

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
  const [formPerfiles, setFormPerfiles] = React.useState("")
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

  // Se actualiza en vivo con los cambios de la tienda y de otras pestañas
  const liveVersion = useLiveVersion("plans", "products")
  React.useEffect(() => { fetchData() }, [fetchData, liveVersion])

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
    setFormPerfiles("")
    setFormDescripcion("")
    setFormProductId("")
    setOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormNombre(plan.nombre)
    setFormSlug(plan.slug)
    setFormDuracion(plan.duracion)
    setFormPerfiles(plan.perfiles ?? "")
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
        perfiles: formPerfiles,
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
    if (!(await confirmAction({ title: `¿Eliminar el plan "${plan.nombre}"?`, description: "Si tiene ventas, mejor desactívalo.", confirmText: "Eliminar", destructive: true }))) return
    try {
      await api.delete(`/plans/${plan.id}`)
      setPlans((prev) => prev.filter((p) => p.id !== plan.id))
      toast.success("Plan eliminado")
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "No se pudo eliminar. Si tiene ventas, desactívalo en su lugar.")
    }
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
    { key: "perfiles", label: "Perfiles", hideOnMobile: true, render: (item) => <span>{item.perfiles || "—"}</span> },
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
              <Select
                value={formProductId || null}
                onValueChange={(v) => setFormProductId((v as string | null) ?? "")}
                items={products.map((prod) => ({ value: prod.id, label: prod.nombre }))}
              >
                <SelectTrigger id="producto" className="w-full">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duracion">Duración</Label>
              <Input id="duracion" placeholder="Ej: 1 año" value={formDuracion} onChange={(e) => setFormDuracion(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="perfiles">Perfiles</Label>
              <ProfilesInput id="perfiles" value={formPerfiles} onChange={setFormPerfiles} />
              <p className="text-xs text-muted-foreground">Ej. 1 perfil o Cuenta completa. Vacío = no se muestra en la tienda.</p>
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
