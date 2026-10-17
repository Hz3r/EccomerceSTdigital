"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Headphones,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCover } from "@/components/product/product-cover";
import { ProductTile } from "@/components/product/product-tile";
import { CategorySpotlight } from "@/components/home/category-spotlight";
import { ExploreCategories } from "@/components/home/explore-categories";
import { GrowWithZerg } from "@/components/home/grow-with-zerg";
import { NewArrivals } from "@/components/home/new-arrivals";
import { Rail } from "@/components/home/rail";
import { SectionHeader } from "@/components/home/section-header";
import { Testimonials } from "@/components/home/testimonials";
import { Newsletter } from "@/components/layout/newsletter";
import { getCategories, getLatestReviews, getProducts } from "@/lib/api";
import { bestDiscount, cheapestPlan, formatPrice } from "@/lib/catalog";
import type { Category, Product, Review } from "@/types";

const FEATURES = [
  { icon: Zap, title: "Entrega inmediata", text: "Recibe tu acceso en minutos, 24/7." },
  { icon: ShieldCheck, title: "Garantía total", text: "Reemplazo sin costo durante tu plan." },
  { icon: BadgePercent, title: "Mejores precios", text: "Hasta 60% menos que el precio oficial." },
  { icon: Headphones, title: "Soporte humano", text: "Te atendemos por WhatsApp al instante." },
];

const PLATFORMS = [
  "Netflix", "Disney+", "Max", "Prime Video", "Spotify", "YouTube", "Crunchyroll",
  "ChatGPT", "Canva", "Microsoft 365", "Xbox", "PlayStation", "NordVPN",
];

const RAILS = [
  { slug: "ia", title: "Inteligencia Artificial", subtitle: "Asistentes, imagen, video, voz y código" },
  { slug: "diseno", title: "Diseño y creatividad", subtitle: "Edición, recursos y herramientas para creadores" },
  { slug: "streaming", title: "Streaming", subtitle: "Series, películas y TV en vivo" },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    Promise.all([
      getProducts().catch(() => []),
      getCategories().catch(() => []),
      getLatestReviews().catch(() => []),
    ])
      .then(([prods, cats, revs]) => {
        setProducts(prods.filter((p) => p.isActivo));
        setCategories(cats.filter((c) => c.isActive));
        setReviews(revs);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Tendencias: los productos con mejor descuento, empezando por un destacado de IA.
  const trending = useMemo(() => {
    const sorted = [...products].sort((a, b) => bestDiscount(b) - bestDiscount(a));
    const hero = products.find((p) => p.slug === "chatgpt-plus");
    return hero ? [hero, ...sorted.filter((p) => p.id !== hero.id)].slice(0, 9) : sorted.slice(0, 9);
  }, [products]);
  const featured = products.find((p) => p.slug === "netflix-premium") ?? products[0];
  const featuredPlan = featured && cheapestPlan(featured);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand-mint/70 px-4 pt-6 pb-24 md:px-6 md:pt-10">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.75fr_1fr]">
          <div className="relative isolate overflow-hidden rounded-3xl bg-surface-ink px-6 py-10 text-white md:px-12 md:py-14">
            <div className="absolute inset-0 -z-10 bg-grid-soft opacity-60" />
            <div className="absolute -top-24 -right-24 -z-10 size-80 rounded-full bg-brand/30 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 -z-10 size-72 rounded-full bg-brand-neon/15 blur-3xl" />

            <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-neon">
                  <Sparkles className="size-3.5" />
                  Nuevos servicios cada semana
                </span>
                <h1 className="mt-5 text-3xl leading-[1.1] font-extrabold tracking-tight md:text-5xl">
                  Todo tu entretenimiento
                  <br />
                  <span className="text-brand-gradient">en un solo lugar</span>
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 md:text-base">
                  Streaming, música, inteligencia artificial y gaming al mejor precio. Compra en segundos y recibe tu
                  acceso al instante.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    className="h-11 rounded-xl bg-brand px-5 font-semibold text-brand-ink hover:bg-brand-bright"
                    render={<Link href="/products" />}
                    nativeButton={false}
                  >
                    Ver catálogo
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-white/20 bg-white/5 px-5 font-semibold text-white hover:bg-white/10 hover:text-white"
                    render={<Link href="/products?ofertas=1" />}
                    nativeButton={false}
                  >
                    Ver ofertas
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto hidden aspect-square w-full max-w-xs md:block">
                <div className="absolute inset-6 rounded-full bg-brand/20 blur-2xl" />
                <Image
                  src="/zerg-icon.png"
                  alt=""
                  width={512}
                  height={512}
                  priority
                  className="relative size-full rounded-full shadow-[0_0_60px_-10px_var(--brand-neon)]"
                />
                <span className="absolute top-2 -left-2 size-7 rotate-45 rounded-md bg-brand-yellow shadow-lg" />
                <span className="absolute -right-1 bottom-10 size-5 rotate-45 rounded bg-brand-neon" />
              </div>
            </div>
          </div>

          <div className="relative isolate flex flex-col justify-between overflow-hidden rounded-3xl bg-brand-gradient p-6 text-brand-ink md:p-8">
            <div className="absolute inset-0 -z-10 bg-checker opacity-60 [mask-image:linear-gradient(to_bottom_left,black,transparent_70%)]" />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase opacity-70">Más vendido</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
                {featured?.nombre ?? "Netflix Premium"}
              </h2>
              <p className="mt-2 max-w-[16rem] text-sm opacity-80">Perfil privado en 4K, listo para usar en minutos.</p>
            </div>
            {featured && (
              <ProductCover
                product={featured}
                size="md"
                className="my-6 aspect-[16/9] rounded-2xl shadow-xl ring-1 ring-black/10"
              />
            )}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold opacity-70">Desde</p>
                <p className="text-3xl font-black tracking-tight">
                  {featuredPlan ? formatPrice(featuredPlan.precio) : "—"}
                </p>
              </div>
              <Link
                href={featured ? `/product/${featured.slug}` : "/products"}
                aria-label="Ver producto"
                className="flex size-12 items-center justify-center rounded-full bg-surface-ink text-white transition-transform hover:scale-105"
              >
                <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="-mt-16 px-4 md:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y rounded-2xl border bg-card shadow-[0_20px_50px_-25px_rgb(7_21_18/0.25)] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 pt-16 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Lo más buscado */}
          <section className="mx-auto w-full max-w-7xl px-4 pt-16 md:px-6 md:pt-20">
            <SectionHeader
              title="Lo más buscado"
              subtitle="Las categorías favoritas de nuestros clientes"
              href="/products"
              className="mb-6"
            />
            <CategorySpotlight categories={categories} products={products} />
          </section>

          {/* Tendencias */}
          {trending.length > 0 && (
            <section className="mt-16 border-y bg-brand-mint/50 py-14 md:mt-20">
              <div className="mx-auto max-w-7xl px-4 md:px-6">
                <SectionHeader
                  title="Tendencias de la semana"
                  subtitle="Lo que más se está comprando ahora mismo"
                  href="/products?ofertas=1"
                  linkLabel="Ver ofertas"
                />
                <div className="mt-6 grid auto-rows-[150px] grid-cols-2 gap-3 sm:grid-cols-3 lg:auto-rows-[170px] lg:grid-cols-[1.6fr_repeat(4,1fr)]">
                  <ProductTile
                    product={trending[0]}
                    size="lg"
                    className="col-span-2 row-span-2 sm:col-span-3 lg:col-span-1"
                  />
                  {trending.slice(1, 9).map((p) => (
                    <ProductTile key={p.id} product={p} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Carruseles por categoría */}
          <div className="mx-auto w-full max-w-7xl space-y-14 px-4 pt-16 md:px-6 md:pt-20">
            {RAILS.map((rail) => {
              const items = products.filter((p) => p.category?.slug === rail.slug).slice(0, 12);
              if (items.length === 0) return null;
              return (
                <Rail
                  key={rail.slug}
                  title={rail.title}
                  subtitle={rail.subtitle}
                  href={`/products?categoria=${rail.slug}`}
                  itemClassName="w-[44%] sm:w-[30%] md:w-[23%] lg:w-[18.6%]"
                >
                  {items.map((p) => (
                    <ProductTile key={p.id} product={p} className="aspect-[4/3.4]" />
                  ))}
                </Rail>
              );
            })}
          </div>
        </>
      )}

      {/* Plataformas */}
      <section className="mt-16 border-y bg-brand-mint/50 py-10 md:mt-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Plataformas</h2>
        </div>
        <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex w-max gap-14">
            {[...PLATFORMS, ...PLATFORMS].map((name, i) => (
              <span
                key={i}
                aria-hidden={i >= PLATFORMS.length}
                className="text-2xl font-black tracking-tight whitespace-nowrap text-foreground/25 transition-colors hover:text-brand-strong md:text-3xl"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {!isLoading && (
        <>
          {/* Explorar categorías */}
          <section className="mx-auto w-full max-w-7xl px-4 pt-16 md:px-6 md:pt-20">
            <SectionHeader
              title="Explora por categoría"
              subtitle="Todo lo digital que necesitas, ordenado para que lo encuentres rápido"
              className="mb-6"
            />
            <ExploreCategories categories={categories} products={products} />
          </section>

          {/* Opiniones */}
          {reviews.length > 0 && (
            <section className="mx-auto w-full max-w-7xl px-4 pt-16 md:px-6 md:pt-20">
              <SectionHeader
                title="Opiniones de clientes"
                subtitle="Reseñas reales de personas que ya compraron en ZERG"
                className="mb-6"
              />
              <Testimonials reviews={reviews} />
            </section>
          )}

          {/* Recién llegados */}
          <section className="mx-auto w-full max-w-7xl px-4 pt-16 md:px-6 md:pt-20">
            <SectionHeader
              title="Recién llegados"
              subtitle="Los últimos servicios que sumamos al catálogo"
              href="/products"
              className="mb-6"
            />
            <NewArrivals products={products} />
          </section>
        </>
      )}

      {/* Crece con ZERG */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-16 md:px-6 md:pt-20">
        <SectionHeader title="Crece con ZERG" subtitle="Dos formas de ganar. Cero barreras para empezar." className="mb-6" />
        <GrowWithZerg />
      </section>

      <Newsletter />
    </div>
  );
}
