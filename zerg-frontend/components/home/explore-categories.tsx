import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "@/components/product/category-icon";
import type { Category, Product } from "@/types";

export function ExploreCategories({ categories, products }: { categories: Category[]; products: Product[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => {
        const items = products.filter((p) => p.category?.slug === cat.slug);
        if (items.length === 0) return null;
        return (
          <article
            key={cat.id}
            className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-colors hover:border-brand/40"
          >
            <Link href={`/products?categoria=${cat.slug}`} className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand-strong ring-1 ring-brand/20 dark:text-brand-bright">
                <CategoryIcon slug={cat.slug} className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-bold transition-colors group-hover:text-brand-strong dark:group-hover:text-brand-bright">
                  {cat.nombre}
                  <ArrowRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </span>
                {cat.descripcion && (
                  <span className="line-clamp-1 text-xs text-muted-foreground">{cat.descripcion}</span>
                )}
              </span>
            </Link>

            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              {items.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-brand/50 hover:text-brand-strong dark:hover:text-brand-bright"
                >
                  {p.nombre}
                </Link>
              ))}
              {items.length > 6 && (
                <Link
                  href={`/products?categoria=${cat.slug}`}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  +{items.length - 6} más
                </Link>
              )}
            </div>

            {/* Línea de brillo inferior al pasar el mouse */}
            <span className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </article>
        );
      })}
    </div>
  );
}
