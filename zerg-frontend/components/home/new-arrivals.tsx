import Link from "next/link";
import { CategoryIcon } from "@/components/product/category-icon";
import { cn } from "@/lib/utils";
import type { ColumnaRecientes } from "@/lib/site-settings";
import type { Product } from "@/types";

// Colores del borde superior de cada columna (se eligen en el admin).
const COLORS: Record<string, string> = {
  verde: "var(--brand)",
  amarillo: "var(--brand-yellow)",
  neon: "var(--brand-neon)",
  azul: "#3b82f6",
  morado: "#8b5cf6",
  rosa: "#ec4899",
  naranja: "#f97316",
  rojo: "#ef4444",
};

const GRID: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function itemsFor(col: ColumnaRecientes, products: Product[], cantidad: number) {
  // Productos elegidos a mano, en ese orden.
  if (col.productos.length > 0) {
    return col.productos
      .map((slug) => products.find((p) => p.slug === slug))
      .filter((p): p is Product => Boolean(p))
      .slice(0, cantidad);
  }
  // Automático: los últimos agregados de sus categorías.
  return products
    .filter((p) => col.categorias.includes(p.category?.slug ?? ""))
    .sort((a, b) => (b.creadoEn ?? "").localeCompare(a.creadoEn ?? ""))
    .slice(0, cantidad);
}

/** Hay al menos una columna con productos (si no, la sección entera se oculta). */
export function hasNewArrivals(products: Product[], columnas: ColumnaRecientes[]) {
  return columnas.some((col) => itemsFor(col, products, 1).length > 0);
}

// Listas compactas con los últimos servicios agregados a cada grupo (configurables en el admin).
// Las columnas sin productos no se muestran.
export function NewArrivals({ products, columnas, cantidad = 8 }: { products: Product[]; columnas: ColumnaRecientes[]; cantidad?: number }) {
  const limit = Math.min(Math.max(Math.round(cantidad) || 8, 1), 12);
  const cols = columnas
    .map((col) => ({ col, items: itemsFor(col, products, limit) }))
    .filter(({ items }) => items.length > 0)
    .slice(0, 4);

  if (cols.length === 0) return null;

  return (
    <div className={cn("grid gap-4", GRID[cols.length])}>
      {cols.map(({ col, items }, i) => (
        <div
          key={`${col.titulo}-${i}`}
          className="rounded-2xl border border-t-4 bg-card p-4"
          style={{ borderTopColor: COLORS[col.color] ?? COLORS.verde }}
        >
          <p className="flex items-center gap-2 px-1 text-sm font-bold">
            <CategoryIcon slug={col.icono || col.categorias[0]} className="size-4 text-muted-foreground" />
            {col.titulo}
          </p>
          <ul className="mt-3 space-y-1">
            {items.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/product/${p.slug}`}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-muted-foreground transition-colors odd:bg-muted/60 hover:bg-muted hover:text-foreground"
                >
                  <span className="size-1.5 shrink-0 rotate-45 bg-brand" />
                  <span className="line-clamp-1">{p.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
