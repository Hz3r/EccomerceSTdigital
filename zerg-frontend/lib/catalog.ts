import type { Plan, Product } from "@/types";

const PEN = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Precios en soles peruanos: S/ 24.90
export function formatPrice(value: number) {
  return `S/ ${PEN.format(value)}`;
}

export function activePlans(product: Product): Plan[] {
  return (product.plans ?? []).filter((p) => p.isActivo);
}

export function cheapestPlan(product: Product): Plan | undefined {
  return activePlans(product).reduce<Plan | undefined>(
    (min, p) => (!min || p.precio < min.precio ? p : min),
    undefined
  );
}

export function discountPercent(plan: Pick<Plan, "precio" | "precioOriginal">) {
  if (!plan.precioOriginal || plan.precioOriginal <= plan.precio) return 0;
  return Math.round(((plan.precioOriginal - plan.precio) / plan.precioOriginal) * 100);
}

export function bestDiscount(product: Product) {
  return Math.max(0, ...activePlans(product).map(discountPercent));
}

export function averageRating(product: Product) {
  const reviews = (product.reviews ?? []).filter((r) => r.isApproved);
  if (reviews.length === 0) return null;
  return {
    value: reviews.reduce((sum, r) => sum + r.puntuacion, 0) / reviews.length,
    count: reviews.length,
  };
}

// Colores de portada para productos sin imagen: se elige uno estable a partir del slug.
const COVERS = [
  { from: "#071512", to: "#0a9e78", accent: "#0be08f" },
  { from: "#0a9e78", to: "#05c48a", accent: "#ffd000" },
  { from: "#0d2420", to: "#1b4d40", accent: "#01f1c4" },
  { from: "#05c48a", to: "#01f1c4", accent: "#071512" },
  { from: "#0b0f0e", to: "#24302d", accent: "#ffd000" },
  { from: "#071512", to: "#123a5c", accent: "#01f1c4" },
];

export function coverFor(slug: string) {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COVERS[hash % COVERS.length];
}
