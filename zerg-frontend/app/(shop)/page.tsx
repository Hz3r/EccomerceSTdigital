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
import { ProductCard } from "@/components/product/product-card";
import { ProductCover } from "@/components/product/product-cover";
import { ProductCarousel } from "@/components/home/product-carousel";
import { Newsletter } from "@/components/layout/newsletter";
import { getCategories, getProducts } from "@/lib/api";
import { bestDiscount, cheapestPlan, formatPrice } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";

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

const PAGE_SIZE = 10;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    Promise.all([getProducts().catch(() => []), getCategories().catch(() => [])])
      .then(([prods, cats]) => {
        setProducts(prods.filter((p) => p.isActivo));
        setCategories(cats.filter((c) => c.isActive));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const popular = useMemo(
    () => [...products].sort((a, b) => bestDiscount(b) - bestDiscount(a)).slice(0, 8),
    [products]
  );
  const filtered = useMemo(
    () => (activeCategory === "all" ? products : products.filter((p) => p.categoryId === activeCategory)),
    [products, activeCategory]
  );
  const featured = products.find((p) => p.slug === "netflix-premium") ?? products[0];
  const featuredPlan = featured && cheapestPlan(featured);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand-mint/70 px-4 pt-6 pb-24 md:px-6 md:pt-10">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.75fr_1fr]">
          <div className="relative isolate overflow-hidden rounded-3xl bg-brand-ink px-6 py-10 text-white md:px-12 md:py-14">
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
                className="flex size-12 items-center justify-center rounded-full bg-brand-ink text-white transition-transform hover:scale-105"
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

      {/* Populares */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-16 md:px-6 md:pt-20">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          popular.length > 0 && <ProductCarousel title="Productos populares" products={popular} />
        )}
      </div>

      {/* Plataformas */}
      <section className="mt-12 border-y bg-brand-mint/50 py-10">
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

      {/* Todos los productos */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-16 md:px-6 md:pt-20">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Todos los productos</h2>
        <div className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {[{ id: "all", nombre: "Todos" }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCategory(c.id);
                setVisible(PAGE_SIZE);
              }}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                activeCategory === c.id
                  ? "border-brand-ink bg-brand-ink text-white"
                  : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />)
            : filtered.slice(0, visible).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!isLoading && filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No hay productos en esta categoría todavía.</p>
        )}
        {visible < filtered.length && (
          <div className="mt-8 flex justify-center">
            <Button className="h-10 rounded-lg px-6 font-semibold" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
              Cargar más productos
            </Button>
          </div>
        )}
      </section>

      {/* Promociones */}
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pt-16 md:grid-cols-[1.75fr_1fr] md:px-6 md:pt-20">
        <PromoTile
          href="/products?categoria=streaming"
          className="bg-brand-ink text-white"
          eyebrow="Para revendedores"
          title="Precios especiales al por mayor"
          text="Arma tu propio negocio de streaming con stock, soporte y precios exclusivos para distribuidores."
          cta="Quiero ser distribuidor"
          decoration={<div className="absolute inset-0 -z-10 bg-grid-soft opacity-70" />}
        />
        <PromoTile
          href="/products?categoria=musica"
          className="bg-brand-yellow text-brand-ink"
          eyebrow="Música"
          title="Spotify y YouTube Premium"
          cta="Ver planes"
          decoration={<div className="absolute inset-0 -z-10 bg-checker opacity-50 [mask-image:linear-gradient(to_top_left,black,transparent_60%)]" />}
        />
        <PromoTile
          href="/products?categoria=ia"
          className="bg-brand-gradient text-brand-ink"
          eyebrow="Inteligencia Artificial"
          title="Potencia tu trabajo con IA"
          cta="Explorar"
          decoration={<div className="absolute inset-0 -z-10 bg-checker opacity-40 [mask-image:linear-gradient(to_top_left,black,transparent_60%)]" />}
        />
        <PromoTile
          href="/products?categoria=gaming"
          className="bg-[linear-gradient(120deg,var(--brand-ink),#123a5c)] text-white"
          eyebrow="Gaming"
          title="Todo para tu setup gamer"
          text="Game Pass, PlayStation Plus y más, con activación inmediata y precios que sí convienen."
          cta="Mejora tu experiencia"
          decoration={<div className="absolute -right-10 -bottom-10 -z-10 size-56 rotate-45 rounded-3xl bg-brand-neon/15" />}
        />
      </section>

      <Newsletter />
    </div>
  );
}

function PromoTile({
  href,
  className,
  eyebrow,
  title,
  text,
  cta,
  decoration,
}: {
  href: string;
  className: string;
  eyebrow: string;
  title: string;
  text?: string;
  cta: string;
  decoration?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative isolate flex min-h-56 flex-col justify-between overflow-hidden rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 md:p-8",
        className
      )}
    >
      {decoration}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase opacity-70">{eyebrow}</p>
        <h3 className="mt-2 max-w-sm text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h3>
        {text && <p className="mt-3 max-w-md text-sm opacity-75">{text}</p>}
      </div>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
        {cta}
        <span className="flex size-8 items-center justify-center rounded-full bg-current/15 transition-transform group-hover:translate-x-1">
          <ArrowRight className="size-4" />
        </span>
      </span>
    </Link>
  );
}
