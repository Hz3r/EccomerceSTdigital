"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductCard } from "@/components/product/product-card";
import { Newsletter } from "@/components/layout/newsletter";
import { getCategories, getProducts } from "@/lib/api";
import { activePlans, bestDiscount, cheapestPlan } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";

const DURATIONS = ["1 mes", "3 meses", "6 meses", "12 meses"];
const PRICE_RANGES = [
  { id: "lt15", label: "Menos de S/ 15", test: (n: number) => n < 15 },
  { id: "15-30", label: "S/ 15 a S/ 30", test: (n: number) => n >= 15 && n <= 30 },
  { id: "30-60", label: "S/ 30 a S/ 60", test: (n: number) => n > 30 && n <= 60 },
  { id: "gt60", label: "Más de S/ 60", test: (n: number) => n > 60 },
];
const SORTS = [
  { id: "popular", label: "Populares" },
  { id: "price-asc", label: "Menor precio" },
  { id: "price-desc", label: "Mayor precio" },
  { id: "discount", label: "Mayor descuento" },
  { id: "name", label: "Nombre (A-Z)" },
];
const PAGE_SIZE = 12;

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageInner />
    </Suspense>
  );
}

function ProductsPageInner() {
  const params = useSearchParams();
  // Reinicia los filtros cuando cambian los parámetros de la URL (búsqueda o categoría desde el navbar).
  return <Catalog key={params.toString()} params={params} />;
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Catalog({ params }: { params: URLSearchParams }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const slug = params.get("categoria");
    return slug ? [slug] : [];
  });
  const [durations, setDurations] = useState<string[]>([]);
  const [priceRanges, setPriceRanges] = useState<string[]>([]);
  const [onlyDeals, setOnlyDeals] = useState(params.get("ofertas") === "1");
  const [sort, setSort] = useState("popular");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    Promise.all([getProducts().catch(() => []), getCategories().catch(() => [])])
      .then(([prods, cats]) => {
        setProducts(prods.filter((p) => p.isActivo));
        setCategories(cats.filter((c) => c.isActive));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      const plans = activePlans(p);
      if (q && !`${p.nombre} ${p.descripcion ?? ""} ${p.category?.nombre ?? ""}`.toLowerCase().includes(q)) return false;
      if (selectedCategories.length && !selectedCategories.includes(p.category?.slug ?? "")) return false;
      if (durations.length && !plans.some((pl) => durations.includes(pl.duracion))) return false;
      if (priceRanges.length) {
        const min = cheapestPlan(p)?.precio;
        if (min === undefined || !PRICE_RANGES.some((r) => priceRanges.includes(r.id) && r.test(min))) return false;
      }
      if (onlyDeals && bestDiscount(p) === 0) return false;
      return true;
    });
    const price = (p: Product) => cheapestPlan(p)?.precio ?? Infinity;
    switch (sort) {
      case "price-asc":
        return list.sort((a, b) => price(a) - price(b));
      case "price-desc":
        return list.sort((a, b) => price(b) - price(a));
      case "discount":
        return list.sort((a, b) => bestDiscount(b) - bestDiscount(a));
      case "name":
        return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
      default:
        return list;
    }
  }, [products, query, selectedCategories, durations, priceRanges, onlyDeals, sort]);

  const activeCategory =
    selectedCategories.length === 1 ? categories.find((c) => c.slug === selectedCategories[0]) : undefined;
  const title = onlyDeals ? "Ofertas" : activeCategory?.nombre ?? "Todos los productos";
  const filterCount = selectedCategories.length + durations.length + priceRanges.length + (onlyDeals ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategories([]);
    setDurations([]);
    setPriceRanges([]);
    setOnlyDeals(false);
  };

  const filters = (
    <FilterPanel
      count={filterCount}
      onClear={clearFilters}
      groups={[
        {
          title: "Categoría",
          options: categories.map((c) => ({
            id: c.slug,
            label: c.nombre,
            count: products.filter((p) => p.category?.slug === c.slug).length,
          })),
          selected: selectedCategories,
          onToggle: (id) => setSelectedCategories((s) => toggle(s, id)),
        },
        {
          title: "Duración",
          options: DURATIONS.map((d) => ({ id: d, label: d })),
          selected: durations,
          onToggle: (id) => setDurations((s) => toggle(s, id)),
        },
        {
          title: "Precio",
          options: PRICE_RANGES.map((r) => ({ id: r.id, label: r.label })),
          selected: priceRanges,
          onToggle: (id) => setPriceRanges((s) => toggle(s, id)),
        },
        {
          title: "Promociones",
          options: [{ id: "deals", label: "Solo productos en oferta" }],
          selected: onlyDeals ? ["deals"] : [],
          onToggle: () => setOnlyDeals((v) => !v),
        },
      ]}
    />
  );

  return (
    <>
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-6 md:px-6 md:pt-12">
          <div className="flex flex-col-reverse gap-3 md:flex-row md:items-end md:justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              {title} <span className="text-brand-strong">({isLoading ? "…" : results.length})</span>
            </h1>
            <nav aria-label="Ruta" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Inicio
              </Link>
              <ChevronRight className="size-3" />
              <Link href="/products" className="hover:text-foreground">
                Productos
              </Link>
              {title !== "Todos los productos" && (
                <>
                  <ChevronRight className="size-3" />
                  <span className="font-medium text-foreground">{title}</span>
                </>
              )}
            </nav>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger render={<Button variant="outline" className="h-10 rounded-lg lg:hidden" />}>
                <SlidersHorizontal className="size-4" />
                Filtros
                {filterCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-brand-ink">
                    {filterCount}
                  </span>
                )}
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-6">{filters}</div>
              </SheetContent>
            </Sheet>

            <label className="relative">
              <span className="sr-only">Ordenar por</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-10 cursor-pointer appearance-none rounded-lg border bg-background pr-9 pl-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            </label>

            <div className="ml-auto flex rounded-lg border p-1" role="group" aria-label="Vista">
              {(
                [
                  ["list", List, "Lista"],
                  ["grid", LayoutGrid, "Cuadrícula"],
                ] as const
              ).map(([id, Icon, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={layout === id}
                  onClick={() => setLayout(id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors",
                    layout === id ? "bg-surface-ink text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-mint/50">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="flex h-12 items-center gap-3 rounded-xl border bg-background px-4 focus-within:border-brand/50 focus-within:ring-3 focus-within:ring-brand/15">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en el catálogo"
              aria-label="Buscar en el catálogo"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
            <aside className="hidden self-start lg:sticky lg:top-36 lg:block">{filters}</aside>

            <div>
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed bg-background py-20 text-center">
                  <Search className="size-10 text-muted-foreground/40" />
                  <p className="mt-4 font-semibold">No encontramos productos</p>
                  <p className="mt-1 text-sm text-muted-foreground">Prueba con otra búsqueda o quita algunos filtros.</p>
                  <Button
                    variant="outline"
                    className="mt-5 rounded-lg"
                    onClick={() => {
                      clearFilters();
                      setQuery("");
                    }}
                  >
                    Limpiar todo
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "grid gap-4",
                      layout === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" : "grid-cols-1"
                    )}
                  >
                    {results.slice(0, visible).map((p) => (
                      <ProductCard key={p.id} product={p} layout={layout} />
                    ))}
                  </div>
                  {visible < results.length && (
                    <div className="mt-8 flex justify-center">
                      <Button className="h-10 rounded-lg px-6 font-semibold" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                        Cargar más productos
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Newsletter />
    </>
  );
}

interface FilterGroup {
  title: string;
  options: { id: string; label: string; count?: number }[];
  selected: string[];
  onToggle: (id: string) => void;
}

function FilterPanel({ groups, count, onClear }: { groups: FilterGroup[]; count: number; onClear: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="flex items-center justify-between bg-surface-ink px-4 py-3.5 text-white">
        <span className="text-sm font-bold">Filtros</span>
        <button
          type="button"
          onClick={onClear}
          disabled={count === 0}
          className="text-xs font-medium text-white/70 hover:text-white disabled:opacity-40"
        >
          Restablecer
        </button>
      </div>
      {groups.map((g) => (
        <details key={g.title} open className="group border-b last:border-b-0">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            {g.title}
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <ul className="space-y-1 px-4 pb-4">
            {g.options.map((o) => {
              const checked = g.selected.includes(o.id);
              return (
                <li key={o.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-sm text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => g.onToggle(o.id)}
                      className="size-4 cursor-pointer rounded border-input accent-[var(--brand-strong)]"
                    />
                    <span className={cn("flex-1", checked && "font-medium text-foreground")}>{o.label}</span>
                    {o.count !== undefined && <span className="text-xs text-muted-foreground/70">{o.count}</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </div>
  );
}
