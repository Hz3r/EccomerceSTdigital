import Link from "next/link";
import { CategoryIcon } from "@/components/product/category-icon";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const COLUMNS = [
  { title: "Inteligencia Artificial", icon: "ia", slugs: ["ia"], accent: "border-t-brand" },
  { title: "Diseño y creatividad", icon: "diseno", slugs: ["diseno"], accent: "border-t-brand-yellow" },
  { title: "Streaming y música", icon: "streaming", slugs: ["streaming", "musica"], accent: "border-t-brand-neon" },
  { title: "Gaming y más", icon: "gaming", slugs: ["gaming", "productividad", "seguridad"], accent: "border-t-[#3b82f6]" },
];

// Listas compactas con los últimos servicios agregados a cada grupo.
export function NewArrivals({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = products
          .filter((p) => col.slugs.includes(p.category?.slug ?? ""))
          .slice(-8)
          .reverse();
        return (
          <div key={col.title} className={cn("rounded-2xl border border-t-4 bg-card p-4", col.accent)}>
            <p className="flex items-center gap-2 px-1 text-sm font-bold">
              <CategoryIcon slug={col.icon} className="size-4 text-muted-foreground" />
              {col.title}
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
        );
      })}
    </div>
  );
}
