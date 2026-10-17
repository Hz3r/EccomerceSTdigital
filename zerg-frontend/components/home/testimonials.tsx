"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Quote } from "lucide-react";
import { Rating } from "@/components/product/rating";
import type { Review } from "@/types";

const AVATAR_COLORS = ["bg-brand text-brand-ink", "bg-brand-yellow text-brand-ink", "bg-brand-neon text-brand-ink", "bg-[#14466b] text-white"];

const dateFormat = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric" });

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Testimonials({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  if (reviews.length === 0) return null;

  // Las opiniones de ejemplo (lib/mock-data.ts) no se presentan como compras verificadas.
  const verified = reviews.some((r) => !r.id.startsWith("testimonial-"));
  const average = reviews.reduce((sum, r) => sum + r.puntuacion, 0) / reviews.length;
  const positive = Math.round((reviews.filter((r) => r.puntuacion >= 4).length / reviews.length) * 100);
  const scroll = (dir: 1 | -1) =>
    trackRef.current?.scrollBy({ left: dir * trackRef.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="relative isolate overflow-hidden rounded-3xl bg-surface-ink p-6 text-white ring-1 ring-white/10">
        <div className="absolute inset-0 -z-10 bg-grid-soft opacity-50" />
        <p className="text-xs font-bold tracking-widest text-white/60 uppercase">Lo que dicen nuestros clientes</p>
        <p className="mt-4 text-6xl font-black tracking-tight">
          {average.toFixed(1)}
          <span className="text-2xl text-white/50">/5</span>
        </p>
        <Rating value={average} className="mt-2 [&_svg]:size-5" />
        <p className="mt-4 text-sm text-white/70">
          <span className="font-bold text-brand-bright">{positive}%</span> de opiniones positivas
        </p>
        {verified && (
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <BadgeCheck className="size-3.5 text-brand-bright" />
            Compras verificadas
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Opiniones anteriores"
            className="flex size-10 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Más opiniones"
            className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-ink transition-colors hover:bg-brand-bright"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <div ref={trackRef} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6 lg:mx-0 lg:px-0">
        {reviews.map((r, i) => (
          <figure key={r.id} className="flex w-[85%] shrink-0 snap-start flex-col sm:w-[46%] xl:w-[31.5%]">
            {/* Globo de diálogo */}
            <div className="relative flex flex-1 flex-col rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <Rating value={r.puntuacion} />
                <Quote className="size-6 text-brand/30" />
              </div>
              {r.comentario && (
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed">{r.comentario}</blockquote>
              )}
              {r.product && (
                <Link
                  href={`/product/${r.product.slug}`}
                  className="mt-4 inline-flex w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Compró {r.product.nombre}
                </Link>
              )}
              <span className="absolute -bottom-2 left-7 size-4 rotate-45 border-r border-b bg-card" />
            </div>
            <figcaption className="mt-4 flex items-center gap-3 pl-3">
              <span
                className={`flex size-9 items-center justify-center rounded-full text-xs font-black ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
              >
                {initials(r.user?.nombre ?? "Cliente")}
              </span>
              <span>
                <span className="block text-sm font-semibold">{r.user?.nombre ?? "Cliente"}</span>
                <span className="block text-[11px] text-muted-foreground">{dateFormat.format(new Date(r.creadoEn))}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
