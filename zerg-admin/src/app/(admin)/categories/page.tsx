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
import type { Category } from "@/types"

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const [imageModalOpen, setImageModalOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const [formNombre, setFormNombre] = React.useState("")
  const [formSlug, setFormSlug] = React.useState("")
  const [formDescripcion, setFormDescripcion] = React.useState("")

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await api.get("/categories")
      setCategories(res.data.data)
    } catch {} finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleToggleStatus = async (cat: Category) => {
    try {
      await api.put(`/categories/${cat.id}`, { isActive: !cat.isActive })
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      )
    } catch {}
  }

  const handleImageSave = async (url: string) => {
    if (!selectedCategory) return
    try {
      await api.put(`/categories/${selectedCategory.id}`, { imagenUrl: url })
      setCategories((prev) =>
        prev.map((c) => (c.id === selectedCategory.id ? { ...c, imagenUrl: url } : c))
      )
    } catch {}
  }

  const openCreate = () => {
    setEditingCategory(null)
    setFormNombre("")
    setFormSlug("")
    setFormDescripcion("")
    setOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormNombre(cat.nombre)
    setFormSlug(cat.slug)
    setFormDescripcion(cat.descripcion ?? "")
    setOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory.id}`, {
          nombre: formNombre,
          slug: formSlug,
          descripcion: formDescripcion || undefined,
        })
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...res.data.data } : c))
        )
      } else {
        const res = await api.post("/categories", {
          nombre: formNombre,
          slug: formSlug,
          descripcion: formDescripcion || undefined,
        })
        setCategories((prev) => [res.data.data, ...prev])
      }
      setOpen(false)
    } catch {} finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return
    try {
      await api.delete(`/categories/${cat.id}`)
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
    } catch {}
  }

  const columns: DataTableColumn<Category>[] = [
    { key: "nombre", label: "Nombre" },
    { key: "slug", label: "Slug" },
    {
      key: "isActive",
      label: "Estado",
      render: (item) => (
        <Badge
          variant={item.isActive ? "default" : "secondary"}
          className="cursor-pointer select-none"
          onClick={(e) => { e.stopPropagation(); handleToggleStatus(item) }}
        >
          {item.isActive ? "Activo" : "Inactivo"}
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
          onClick={(e) => { e.stopPropagation(); setSelectedCategory(item); setImageModalOpen(true) }}
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

  const actions: DataTableAction<Category>[] = [
    { label: "Editar", icon: <PencilIcon className="size-3.5" />, onClick: (item) => openEdit(item) },
    { label: "Eliminar", icon: <TrashIcon className="size-3.5" />, variant: "destructive", onClick: (item) => handleDelete(item) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categorías</h1>
          <p className="mt-1 text-sm text-slate-600">Gestiona las categorías de tu tienda</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Nueva Categoría</span>
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
              data={categories as unknown as Record<string, unknown>[]}
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              actions={actions as unknown as DataTableAction<Record<string, unknown>>[]}
              searchPlaceholder="Buscar categoría..."
              searchKey="nombre"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Modifica los datos de la categoría" : "Completa los datos para crear una categoría"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" placeholder="Nombre de la categoría" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="slug-de-la-categoria" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input id="descripcion" placeholder="Descripción (opcional)" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Guardando..." : editingCategory ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        value={selectedCategory?.imagenUrl ?? ""}
        onSave={handleImageSave}
        title="Imagen de la categoría"
      />
    </div>
  )
}
