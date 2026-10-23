"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { ExternalLink, ImageIcon, Loader2, PencilIcon, PlusIcon, TrashIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type DataTableAction, type DataTableColumn } from "@/components/data-table/data-table"
import { ImageField } from "@/components/image-field"
import { useLiveVersion } from "@/lib/live"
import api from "@/lib/axios"
import { assetUrl, formatPrice, slugify, STORE_URL } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Category, Product } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductContentEditor, type ProductContent } from "@/components/products/product-content-editor"
import { ProductReviews } from "@/components/products/product-reviews"

interface PlanDraft {
  id?: string // sin id = plan nuevo
  nombre: string
  duracion: string
  precio: string
  precioOriginal: string
  isActivo: boolean
}

interface ProductDraft extends ProductContent {
  nombre: string
  slug: string
  descripcion: string
  categoryId: string
  imagenUrl: string
  isActivo: boolean
  plans: PlanDraft[]
}

const EMPTY_PLAN: PlanDraft = { nombre: "1 mes", duracion: "1 mes", precio: "", precioOriginal: "", isActivo: true }

function toDraft(product?: Product): ProductDraft {
  return {
    nombre: product?.nombre ?? "",
    slug: product?.slug ?? "",
    descripcion: product?.descripcion ?? "",
    categoryId: product?.categoryId ?? "",
    imagenUrl: product?.imagenUrl ?? "",
    isActivo: product?.isActivo ?? true,
    incluye: product?.incluye ?? [],
    pasos: product?.pasos ?? [],
    faqs: product?.faqs ?? [],
    plans: product?.plans?.length
      ? product.plans.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          duracion: p.duracion,
          precio: String(Number(p.precio)),
          precioOriginal: p.precioOriginal ? String(Number(p.precioOriginal)) : "",
          isActivo: p.isActivo,
        }))
      : [{ ...EMPTY_PLAN }],
  }
}

function apiError(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback
}

export default function ProductsPage() {
  return (
    <React.Suspense>
      <ProductsPageInner />
    </React.Suspense>
  )
}

function ProductsPageInner() {
  const searchParams = useSearchParams()
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  // ?nuevo=1 (desde el dashboard) abre directamente el editor vacío
  const [editor, setEditor] = React.useState<{ product?: Product } | null>(() =>
    searchParams.get("nuevo") === "1" ? {} : null
  )

  const fetchData = React.useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([api.get("/products"), api.get("/categories")])
      setProducts(prodRes.data.data)
      setCategories(catRes.data.data)
    } catch {} finally {
      setIsLoading(false)
    }
  }, [])

  // Se actualiza en vivo con los cambios de la tienda y de otras pestañas
  const liveVersion = useLiveVersion("products", "plans", "categories")

  React.useEffect(() => {
    fetchData()
  }, [fetchData, liveVersion])

  const openEdit = async (prod: Product) => {
    // El detalle trae también los planes inactivos
    try {
      const res = await api.get(`/products/${prod.id}`)
      setEditor({ product: res.data.data })
    } catch {
      setEditor({ product: prod })
    }
  }

  const handleToggleStatus = async (prod: Product) => {
    try {
      await api.put(`/products/${prod.id}`, { isActivo: !prod.isActivo })
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, isActivo: !p.isActivo } : p)))
    } catch {}
  }

  const handleDelete = async (prod: Product) => {
    if (!window.confirm(`¿Eliminar el producto "${prod.nombre}"? Si tiene ventas, mejor desactívalo.`)) return
    try {
      await api.delete(`/products/${prod.id}`)
      setProducts((prev) => prev.filter((p) => p.id !== prod.id))
    } catch (err) {
      window.alert(apiError(err, "No se pudo eliminar. Si tiene planes u órdenes, desactívalo en su lugar."))
    }
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: "nombre",
      label: "Producto",
      render: (item) => (
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {item.imagenUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(item.imagenUrl)} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-4 text-muted-foreground" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{item.nombre}</span>
            <span className="block truncate text-xs text-muted-foreground">/{item.slug}</span>
          </span>
        </div>
      ),
    },
    {
      key: "categoryId",
      label: "Categoría",
      hideOnMobile: true,
      render: (item) => <span>{categories.find((c) => c.id === item.categoryId)?.nombre ?? "—"}</span>,
    },
    {
      key: "plans",
      label: "Planes",
      hideOnMobile: true,
      render: (item) => {
        const prices = (item.plans ?? []).map((p) => Number(p.precio))
        return prices.length ? (
          <span className="text-sm">
            {prices.length} · desde <b>{formatPrice(Math.min(...prices))}</b>
          </span>
        ) : (
          <span className="text-xs text-viz-critical">Sin planes activos</span>
        )
      },
    },
    {
      key: "isActivo",
      label: "Estado",
      render: (item) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleToggleStatus(item)
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            item.isActivo ? "bg-brand/15 text-brand-strong dark:text-brand-bright" : "bg-muted text-muted-foreground"
          )}
          title="Cambiar estado"
        >
          <span className={cn("size-1.5 rounded-full", item.isActivo ? "bg-brand" : "bg-muted-foreground")} />
          {item.isActivo ? "Visible" : "Oculto"}
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea servicios con sus planes; los productos visibles aparecen al instante en la tienda.
          </p>
        </div>
        <Button className="h-10 rounded-xl" onClick={() => setEditor({})}>
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Nuevo producto</span>
        </Button>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
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

      <Dialog open={editor !== null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          {editor && (
            <ProductEditor
              key={editor.product?.id ?? "nuevo"}
              product={editor.product}
              categories={categories}
              onCancel={() => setEditor(null)}
              onSaved={() => {
                setEditor(null)
                fetchData()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductEditor({ product, categories, onCancel, onSaved }: {
  product?: Product
  categories: Category[]
  onCancel: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = React.useState<ProductDraft>(() => toDraft(product))
  const [slugTouched, setSlugTouched] = React.useState(Boolean(product))
  const [removedPlans, setRemovedPlans] = React.useState<string[]>([])
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const setPlan = (i: number, patch: Partial<PlanDraft>) =>
    setDraft((d) => ({ ...d, plans: d.plans.map((p, j) => (j === i ? { ...p, ...patch } : p)) }))

  const validate = () => {
    if (!draft.nombre.trim()) return "Escribe el nombre del producto"
    if (!draft.slug.trim()) return "El slug es obligatorio"
    if (!draft.categoryId) return "Elige una categoría"
    for (const p of draft.plans) {
      if (!p.nombre.trim() || !p.duracion.trim()) return "Cada plan necesita nombre y duración"
      if (!(Number(p.precio) > 0)) return `El plan "${p.nombre}" necesita un precio mayor a 0`
      if (p.precioOriginal && Number(p.precioOriginal) <= Number(p.precio))
        return `El precio original de "${p.nombre}" debe ser mayor al precio de venta`
    }
    return ""
  }

  const save = async () => {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError("")
    setIsSaving(true)
    try {
      const body = {
        nombre: draft.nombre.trim(),
        slug: draft.slug.trim(),
        descripcion: draft.descripcion.trim() || undefined,
        categoryId: draft.categoryId,
        imagenUrl: draft.imagenUrl,
        isActivo: draft.isActivo,
        // Lista vacía = la tienda usa los textos generales
        incluye: draft.incluye.map((x) => x.trim()).filter(Boolean),
        pasos: draft.pasos.filter((p) => p.titulo.trim() || p.texto.trim()),
        faqs: draft.faqs.filter((f) => f.pregunta.trim() && f.respuesta.trim()),
      }
      const saved: Product = product
        ? (await api.put(`/products/${product.id}`, body)).data.data
        : (await api.post("/products", body)).data.data
      // La creación siempre lo deja visible; si se marcó como oculto se actualiza después
      if (!product && !draft.isActivo) await api.put(`/products/${saved.id}`, { isActivo: false })

      // Sincroniza los planes del producto
      for (const p of draft.plans) {
        const payload = {
          nombre: p.nombre.trim(),
          duracion: p.duracion.trim(),
          precio: Number(p.precio),
          precioOriginal: p.precioOriginal ? Number(p.precioOriginal) : null,
          isActivo: p.isActivo,
        }
        if (p.id) {
          await api.put(`/plans/${p.id}`, payload)
        } else {
          const created = (
            await api.post("/plans", {
              ...payload,
              precioOriginal: payload.precioOriginal ?? undefined,
              slug: `${saved.slug}-${slugify(p.nombre)}-${Date.now().toString(36)}`,
              productId: saved.id,
            })
          ).data.data
          if (!p.isActivo) await api.put(`/plans/${created.id}`, { isActivo: false })
        }
      }
      for (const id of removedPlans) {
        // Un plan con ventas no se puede borrar: se oculta
        await api.delete(`/plans/${id}`).catch(() => api.put(`/plans/${id}`, { isActivo: false }))
      }
      onSaved()
    } catch (err) {
      setError(apiError(err, "No se pudo guardar el producto"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg">{product ? `Editar ${product.nombre}` : "Nuevo producto"}</DialogTitle>
        <DialogDescription>
          {product ? (
            <a
              href={`${STORE_URL}/product/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-strong hover:underline dark:text-brand-bright"
            >
              Ver en la tienda <ExternalLink className="size-3" />
            </a>
          ) : (
            "Completa los datos y agrega al menos un plan."
          )}
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="general" className="gap-4">
        <TabsList>
          <TabsTrigger value="general">General y planes</TabsTrigger>
          <TabsTrigger value="pagina">Página del producto</TabsTrigger>
          {product && <TabsTrigger value="resenas">Reseñas</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Ej. Netflix Premium"
              value={draft.nombre}
              onChange={(e) => {
                const nombre = e.target.value
                setDraft((d) => ({ ...d, nombre, slug: slugTouched ? d.slug : slugify(nombre) }))
              }}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                placeholder="netflix-premium"
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set("slug", slugify(e.target.value))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={draft.categoryId || null}
                onValueChange={(v) => set("categoryId", (v as string | null) ?? "")}
                items={categories.map((cat) => ({ value: cat.id, label: cat.nombre }))}
              >
                <SelectTrigger id="categoria" className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              rows={3}
              placeholder="Resumen que aparece bajo el nombre y en la pestaña Descripción"
              value={draft.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Imagen</Label>
            <ImageField value={draft.imagenUrl} onChange={(url) => set("imagenUrl", url)} folder="products" className="flex-col" previewClassName="aspect-[4/3] size-auto w-full" />
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm">
            <span>
              <span className="block font-medium">Visible en la tienda</span>
              <span className="block text-xs text-muted-foreground">Ocúltalo sin borrarlo</span>
            </span>
            <input
              type="checkbox"
              checked={draft.isActivo}
              onChange={(e) => set("isActivo", e.target.checked)}
              className="size-4 accent-[var(--brand)]"
            />
          </label>
        </div>
      </div>

      {/* Planes */}
      <div className="rounded-xl border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-semibold">Planes y precios</p>
            <p className="text-xs text-muted-foreground">En soles. El precio original muestra el descuento en la tienda.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraft((d) => ({ ...d, plans: [...d.plans, { ...EMPTY_PLAN, nombre: "", duracion: "" }] }))}
          >
            <PlusIcon className="size-3.5" />
            Agregar plan
          </Button>
        </div>
        <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto_auto] gap-2 px-4 pt-3 text-[11px] font-semibold text-muted-foreground uppercase sm:grid">
          <span>Nombre</span>
          <span>Duración</span>
          <span>Precio</span>
          <span>Original</span>
          <span>Activo</span>
          <span className="w-7" />
        </div>
        <ul className="space-y-2 p-4 pt-2">
          {draft.plans.map((p, i) => (
            <li key={p.id ?? `nuevo-${i}`} className="grid grid-cols-2 gap-2 sm:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto_auto] sm:items-center">
              <Input aria-label="Nombre del plan" placeholder="Premium" value={p.nombre} onChange={(e) => setPlan(i, { nombre: e.target.value })} />
              <Input aria-label="Duración" placeholder="1 mes" value={p.duracion} onChange={(e) => setPlan(i, { duracion: e.target.value })} />
              <Input aria-label="Precio" type="number" min="0" step="0.1" placeholder="24.90" value={p.precio} onChange={(e) => setPlan(i, { precio: e.target.value })} />
              <Input aria-label="Precio original" type="number" min="0" step="0.1" placeholder="—" value={p.precioOriginal} onChange={(e) => setPlan(i, { precioOriginal: e.target.value })} />
              <input
                type="checkbox"
                aria-label="Plan activo"
                checked={p.isActivo}
                onChange={(e) => setPlan(i, { isActivo: e.target.checked })}
                className="size-4 justify-self-center accent-[var(--brand)]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Quitar plan"
                disabled={draft.plans.length === 1}
                onClick={() => {
                  if (p.id) setRemovedPlans((r) => [...r, p.id!])
                  setDraft((d) => ({ ...d, plans: d.plans.filter((_, j) => j !== i) }))
                }}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

        </TabsContent>

        <TabsContent value="pagina">
          <ProductContentEditor
            value={{ incluye: draft.incluye, pasos: draft.pasos, faqs: draft.faqs }}
            onChange={(c) => setDraft((d) => ({ ...d, ...c }))}
          />
        </TabsContent>

        {product && (
          <TabsContent value="resenas">
            <ProductReviews productId={product.id} />
          </TabsContent>
        )}
      </Tabs>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={save} disabled={isSaving}>
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {isSaving ? "Guardando..." : product ? "Guardar cambios" : "Crear producto"}
        </Button>
      </DialogFooter>
    </>
  )
}

