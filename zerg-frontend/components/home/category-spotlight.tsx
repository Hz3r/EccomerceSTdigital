import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "@/components/product/category-icon";
import { cheapestPlan, formatPrice } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";

// Estilo de cada tarjeta según la categoría (paleta del logo ZERG).
const THEMES: Record<string, { card: string; badge: string; pill: string; button: string }> = {
  ia: {
    card: "bg-brand-gradient text-brand-ink",
    badge: "bg-brand-ink text-brand-bright",
    pill: "border-brand-ink/25 bg-white/25",
    button: "bg-brand-ink text-white hover:bg-brand-ink/85",
  },
  streaming: {
    card: "bg-surface-ink text-white ring-1 ring-white/10",
    badge: "bg-brand text-brand-ink",
    pill: "border-white/20 bg-white/5",
    button: "bg-brand text-brand-ink hover:bg-brand-bright",
  },
  diseno: {
    card: "bg-brand-yellow text-brand-ink",
    badge: "bg-brand-ink text-brand-yellow",
    pill: "border-brand-ink/25 bg-white/30",
    button: "bg-brand-ink text-white hover:bg-brand-ink/85",
  },
  gaming: {
    card: "bg-[linear-gradient(140deg,#0b2236,#14466b)] text-white ring-1 ring-white/10",
    badge: "bg-brand-neon text-brand-ink",
    pill: "border-white/20 bg-white/5",
    button: "bg-brand-neon text-brand-ink hover:bg-brand-neon/85",
  },
};

const SHORT_NAMES: Record<string, string> = { ia: "IA", diseno: "Diseño" };

export function CategorySpotlight({ categories, products }: { categories: Category[]; products: Product[] }) {
  const cards = ["ia", "streaming", "diseno", "gaming"]
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is Category => Boolean(c));

  return (
    <div className="grid gap-x-4 gap-y-10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((cat) => {
        const theme = THEMES[cat.slug];
        const items = products.filter((p) => p.category?.slug === cat.slug);
        return (
          <article
            key={cat.id}
            className={cn("relative isolate flex flex-col overflow-visible rounded-3xl p-5 pt-8", theme.card)}
          >
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
              <div className="absolute -right-10 -bottom-10 size-40 rotate-45 rounded-3xl bg-current opacity-[0.06]" />
            </div>
            <span
              className={cn(
                "absolute -top-6 left-5 flex size-12 rotate-45 items-center justify-center rounded-xl shadow-lg",
                theme.badge
              )}
            >
              <CategoryIcon slug={cat.slug} className="size-5 -rotate-45" />
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="ml-14 truncate text-xs font-black tracking-widest uppercase" title={cat.nombre}>
                {SHORT_NAMES[cat.slug] ?? cat.nombre}
              </h3>
              <span className="shrink-0 text-[11px] font-semibold opacity-70">{items.length} servicios</span>
            </div>

            <ul className="mt-5 flex-1 divide-y divide-current/10">
              {items.slice(0, 5).map((p) => {
                const plan = cheapestPlan(p);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-75"
                    >
                      <span className="line-clamp-1">{p.nombre}</span>
                      {plan && (
                        <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold", theme.pill)}>
                          {formatPrice(plan.precio)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Link
              href={`/products?categoria=${cat.slug}`}
              className={cn(
                "mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
                theme.button
              )}
            >
              Ver más
              <ArrowRight className="size-4" />
            </Link>
          </article>
        );
      })}
    </div>
  );
}
