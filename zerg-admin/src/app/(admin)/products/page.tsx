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
import { ImageModal } from "@/components/image-modal"
import api from "@/lib/axios"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ImageIcon,
} from "lucide-react"
import type { Product, Category } from "@/types"

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [imageModalOpen, setImageModalOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const [formNombre, setFormNombre] = React.useState("")
  const [formSlug, setFormSlug] = React.useState("")
  const [formDescripcion, setFormDescripcion] = React.useState("")
  const [formCategoryId, setFormCategoryId] = React.useState("")

  const fetchData = React.useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ])
      setProducts(prodRes.data.data)
      setCategories(catRes.data.data)
    } catch {} finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  const handleToggleStatus = async (prod: Product) => {
    try {
      await api.put(`/products/${prod.id}`, { isActivo: !prod.isActivo })
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, isActivo: !p.isActivo } : p))
      )
    } catch {}
  }

  const handleImageSave = async (url: string) => {
    if (!selectedProduct) return
    try {
      await api.put(`/products/${selectedProduct.id}`, { imagenUrl: url })
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...p, imagenUrl: url } : p))
      )
    } catch {}
  }

  const openCreate = () => {
    setEditingProduct(null)
    setFormNombre("")
    setFormSlug("")
    setFormDescripcion("")
    setFormCategoryId("")
    setOpen(true)
  }

  const openEdit = (prod: Product) => {
    setEditingProduct(prod)
    setFormNombre(prod.nombre)
    setFormSlug(prod.slug)
    setFormDescripcion(prod.descripcion ?? "")
    setFormCategoryId(prod.categoryId)
    setOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct.id}`, {
          nombre: formNombre,
          slug: formSlug,
          descripcion: formDescripcion || undefined,
          categoryId: formCategoryId,
        })
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...res.data.data } : p))
        )
      } else {
        const res = await api.post("/products", {
          nombre: formNombre,
          slug: formSlug,
          descripcion: formDescripcion || undefined,
          categoryId: formCategoryId,
        })
        setProducts((prev) => [res.data.data, ...prev])
      }
      setOpen(false)
    } catch {} finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (prod: Product) => {
    if (!window.confirm(`¿Eliminar el producto "${prod.nombre}"?`)) return
    try {
      await api.delete(`/products/${prod.id}`)
      setProducts((prev) => prev.filter((p) => p.id !== prod.id))
    } catch {}
  }

  const columns: DataTableColumn<Product>[] = [
    { key: "nombre", label: "Nombre" },
    {
      key: "categoryId",
      label: "Categoría",
      hideOnMobile: true,
      render: (item) => {
        const cat = categories.find((c) => c.id === item.categoryId)
        return <span>{cat?.nombre ?? "—"}</span>
      },
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
    {
      key: "imagenUrl",
      label: "Imagen",
      render: (item) => (
        <button
          type="button"
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setSelectedProduct(item); setImageModalOpen(true) }}
        >
          {item.imagenUrl ? (
            <img src={item.imagenUrl} alt={item.nombre} className="h-8 w-8 rounded object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </button>
      ),
    },
  ]

  const actions: DataTableAction<Product>[] = [
    { label: "Editar", icon: <PencilIcon className="size-3.5" />, onClick: (item) => openEdit(item) },
    { label: "Eliminar", icon: <TrashIcon className="size-3.5" />, variant: "destructive", onClick: (item) => handleDelete(item) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
          <p className="mt-1 text-sm text-slate-600">Gestiona los productos de tu tienda</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Nuevo Producto</span>
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
              data={products as unknown as Record<string, unknown>[]}
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              actions={actions as unknown as DataTableAction<Record<string, unknown>>[]}
              searchPlaceholder="Buscar producto..."
              searchKey="nombre"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica los datos del producto" : "Completa los datos para crear un producto"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" placeholder="Nombre del producto" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="slug-del-producto" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input id="descripcion" placeholder="Descripción (opcional)" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoría</Label>
              <select
                id="categoria"
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Guardando..." : editingProduct ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        value={selectedProduct?.imagenUrl ?? ""}
        onSave={handleImageSave}
        title="Imagen del producto"
      />
    </div>
  )
}
