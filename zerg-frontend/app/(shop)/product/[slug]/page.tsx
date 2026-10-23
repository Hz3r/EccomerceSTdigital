"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Heart,
  Minus,
  MonitorSmartphone,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanSelector } from "@/components/product/plan-selector";
import { ProductCover } from "@/components/product/product-cover";
import { ReviewForm, StoreReply } from "@/components/product/review-form";
import { useFavorites } from "@/hooks/useFavorites";
import { productFaqs, productIncluye, productPasos } from "@/lib/product-content";
import { Rating } from "@/components/product/rating";
import { ProductCarousel } from "@/components/home/product-carousel";
import { Newsletter } from "@/components/layout/newsletter";
import { MAX_QUANTITY, clampQuantity, useCart } from "@/hooks/useCart";
import { useLiveVersion } from "@/lib/live";
import { getProductBySlug, getProducts } from "@/lib/api";
import { activePlans, averageRating, cheapestPlan, discountPercent, formatPrice } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const TABS = [
  { id: "descripcion", label: "Descripción" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "resenas", label: "Reseñas" },
  { id: "preguntas", label: "Preguntas frecuentes" },
] as const;

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { addItem, items, updateQuantity } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planId, setPlanId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  // Con #resenas (desde una notificación o tras iniciar sesión para opinar) se abre esa pestaña.
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(() =>
    typeof window !== "undefined" && window.location.hash === "#resenas" ? "resenas" : "descripcion"
  );
  const { isFavorite, toggle: toggleFavorite } = useFavorites();

  const jumpedToReviews = useRef(false);
  // Error al cargar (servidor caído o desactualizado) ≠ producto inexistente (404)
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);

  // Se actualiza en vivo cuando el admin cambia el catálogo
  const liveVersion = useLiveVersion("products", "plans", "reviews");

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      getProductBySlug(slug).then(
        (prod) => ({ prod, error: "" }),
        (err: { response?: { status?: number; data?: { message?: string } } }) => ({
          prod: null,
          error: err.response?.status === 404 ? "" : err.response?.data?.message ?? "No hay conexión con la tienda.",
        })
      ),
      getProducts().catch(() => []),
    ])
      .then(([{ prod, error }, all]) => {
        setLoadError(error);
        // Si falla una actualización en vivo se mantiene lo que ya se mostraba
        if (error) return;
        setProduct(prod);
        if (prod) {
          // Conserva el plan elegido si sigue disponible tras una actualización en vivo
          setPlanId((current) =>
            prod.plans?.some((p) => p.id === current && p.isActivo) ? current : cheapestPlan(prod)?.id
          );
          setRelated(
            all
              .filter((p) => p.isActivo && p.id !== prod.id)
              .sort((a, b) => Number(b.categoryId === prod.categoryId) - Number(a.categoryId === prod.categoryId))
              .slice(0, 8)
          );
        }
      })
      .finally(() => {
        setIsLoading(false);
        // El navegador no puede saltar a #resenas mientras la página carga: se hace al terminar.
        if (!jumpedToReviews.current && window.location.hash === "#resenas") {
          jumpedToReviews.current = true;
          requestAnimationFrame(() => document.getElementById("resenas")?.scrollIntoView({ behavior: "smooth" }));
        }
      });
  }, [slug, liveVersion, attempt]);

  const plans = useMemo(() => (product ? activePlans(product) : []), [product]);
  const reviews = useMemo(() => (product?.reviews ?? []).filter((r) => r.isApproved), [product]);
  const rating = product ? averageRating(product) : null;
  const plan = plans.find((p) => p.id === planId) ?? plans[0];

  const addToCart = () => {
    if (!product || !plan) return;
    const current = items.find((i) => i.planId === plan.id)?.cantidad ?? 0;
    addItem(plan, product);
    updateQuantity(plan.id, current + quantity);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid animate-pulse gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="aspect-[4/3] rounded-3xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-64 rounded-3xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product && loadError) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:px-6">
        <p className="text-2xl font-extrabold">No pudimos cargar el producto</p>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
        <div className="mt-6 flex gap-2">
          <Button
            className="rounded-lg"
            onClick={() => {
              setIsLoading(true);
              setAttempt((a) => a + 1);
            }}
          >
            Reintentar
          </Button>
          <Button variant="outline" className="rounded-lg" render={<Link href="/products" />} nativeButton={false}>
            Ver catálogo
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:px-6">
        <p className="text-2xl font-extrabold">Producto no encontrado</p>
        <p className="mt-2 text-sm text-muted-foreground">Puede que ya no esté disponible.</p>
        <Button className="mt-6 rounded-lg" render={<Link href="/products" />} nativeButton={false}>
          Ver catálogo
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-8">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/products" className="hover:text-foreground">
            Productos
          </Link>
          {product.category && (
            <>
              <ChevronRight className="size-3" />
              <Link href={`/products?categoria=${product.category.slug}`} className="hover:text-foreground">
                {product.category.nombre}
              </Link>
            </>
          )}
          <ChevronRight className="size-3" />
          <span className="font-medium text-foreground">{product.nombre}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
          {/* Galería e info */}
          <div>
            <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
              <ProductCover product={product} size="lg" className="aspect-[4/3] rounded-3xl" />
              <div className="hidden flex-col gap-3 sm:flex">
                <ProductCover product={product} size="sm" className="aspect-square rounded-2xl ring-2 ring-brand" />
                <InfoThumb icon={MonitorSmartphone} label="Multi-dispositivo" />
                <InfoThumb icon={ShieldCheck} label="Garantía" />
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm font-semibold text-brand-strong">{product.category?.nombre ?? "Digital"}</p>
              <div className="mt-1 flex items-start justify-between gap-4">
                <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{product.nombre}</h1>
                <button
                  type="button"
                  aria-label={isFavorite(product.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                  aria-pressed={isFavorite(product.id)}
                  onClick={() => toggleFavorite(product.id, product.nombre)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-muted"
                >
                  <Heart className={cn("size-4 transition-transform active:scale-125", isFavorite(product.id) && "fill-destructive text-destructive")} />
                </button>
              </div>
              {rating && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Rating value={rating.value} />
                  <span>
                    {rating.value.toFixed(1)} · {rating.count} reseñas
                  </span>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {["Entrega inmediata", "Garantía todo el plan", "TV · Celular · PC"].map((chip) => (
                  <span key={chip} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {chip}
                  </span>
                ))}
              </div>
              {product.descripcion && (
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{product.descripcion}</p>
              )}
            </div>
          </div>

          {/* Caja de compra */}
          <aside className="self-start rounded-3xl bg-brand-mint p-5 ring-1 ring-brand/15 md:p-7 lg:sticky lg:top-36">
            {plan ? (
              <>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-4xl font-black tracking-tight">{formatPrice(plan.precio * quantity)}</p>
                  {plan.precioOriginal && plan.precioOriginal > plan.precio ? (
                    <p className="pb-1 text-sm text-muted-foreground">
                      <span className="line-through">{formatPrice(plan.precioOriginal * quantity)}</span>{" "}
                      <span className="font-bold text-brand-strong">-{discountPercent(plan)}%</span>
                    </p>
                  ) : (
                    <p className="pb-1 text-sm text-muted-foreground">por {plan.duracion}</p>
                  )}
                </div>

                <p className="mt-6 mb-2.5 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                  Elige tu plan
                </p>
                <PlanSelector plans={plans} value={plan.id} onChange={setPlanId} />

                <div className="mt-5 flex gap-2">
                  <div className="flex h-11 items-center rounded-xl border bg-background">
                    <button
                      type="button"
                      aria-label="Disminuir cantidad"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => clampQuantity(q - 1))}
                      className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted-foreground"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Aumentar cantidad"
                      disabled={quantity >= MAX_QUANTITY}
                      onClick={() => setQuantity((q) => clampQuantity(q + 1))}
                      className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted-foreground"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <Button className="h-11 flex-1 rounded-xl font-semibold" onClick={addToCart}>
                    <ShoppingCart className="size-4" />
                    Añadir al carrito
                  </Button>
                </div>
                <Button
                  className="mt-2 h-11 w-full rounded-xl bg-brand font-semibold text-brand-ink hover:bg-brand-bright"
                  onClick={() => {
                    addToCart();
                    router.push("/checkout");
                  }}
                >
                  <Zap className="size-4 fill-current" />
                  Comprar ahora
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Este producto no tiene planes disponibles por ahora.</p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-2">
              <DeliveryTile icon={Zap} title="Entrega inmediata" text="En minutos a tu correo" />
              <DeliveryTile icon={RefreshCw} title="Reemplazo gratis" text="Durante todo el plan" />
            </div>
          </aside>
        </div>
      </div>

      {/* Pestañas */}
      <section id="resenas" className="mt-14 scroll-mt-28 border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div role="tablist" className="scrollbar-none -mx-4 flex overflow-x-auto px-4 md:mx-0 md:px-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative shrink-0 px-5 py-4 text-sm font-semibold transition-colors md:flex-1",
                  tab === t.id
                    ? "bg-background text-foreground after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-brand"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {t.id === "resenas" && reviews.length > 0 && ` (${reviews.length})`}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-background">
          <div role="tabpanel" className="mx-auto max-w-7xl px-4 py-10 md:px-6">
            {tab === "descripcion" && (
              <div className="max-w-3xl space-y-6 text-sm leading-relaxed">
                <div>
                  <h3 className="font-bold">Sobre {product.nombre}</h3>
                  <p className="mt-1 text-muted-foreground">{product.descripcion}</p>
                </div>
                <div>
                  <h3 className="font-bold">¿Qué incluye?</h3>
                  <ul className="mt-2 space-y-1.5 text-muted-foreground">
                    {productIncluye(product).map((li) => (
                      <li key={li} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-brand" />
                        {li}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === "como-funciona" && (
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {productPasos(product).map((s, i) => (
                  <li key={`${i}-${s.titulo}`} className="rounded-2xl border p-5">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-surface-ink text-sm font-black text-brand">
                      {i + 1}
                    </span>
                    <p className="mt-4 font-semibold">{s.titulo}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.texto}</p>
                  </li>
                ))}
              </ol>
            )}

            {tab === "resenas" && (
              <div className="space-y-6">
                <ReviewForm productId={product.id} slug={product.slug} />
                {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay reseñas publicadas para este producto.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {reviews.map((r) => (
                    <figure key={r.id} className="rounded-2xl border p-5">
                      <Rating value={r.puntuacion} />
                      {r.comentario && <blockquote className="mt-3 text-sm">“{r.comentario}”</blockquote>}
                      <figcaption className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex size-7 items-center justify-center rounded-full bg-brand/15 font-bold text-brand-strong">
                          {r.user?.nombre?.charAt(0) ?? "?"}
                        </span>
                        {r.user?.nombre ?? "Cliente"}
                      </figcaption>
                      {r.respuesta && <StoreReply text={r.respuesta} />}
                    </figure>
                  ))}
                </div>
              )}
              </div>
            )}

            {tab === "preguntas" && (
              <div className="max-w-3xl divide-y rounded-2xl border">
                {productFaqs(product).map((f) => (
                  <details key={f.pregunta} className="group px-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                      {f.pregunta}
                      <Plus className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
                    </summary>
                    <p className="pb-4 text-sm whitespace-pre-line text-muted-foreground">{f.respuesta}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-10 md:px-6">
          <ProductCarousel title="También te puede interesar" products={related} />
        </div>
      )}

      <Newsletter />
    </>
  );
}

function InfoThumb({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border bg-card p-2 text-center">
      <Icon className="size-5 text-brand-strong" />
      <span className="text-[10px] leading-tight font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function DeliveryTile({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-background p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-xs font-semibold">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}
