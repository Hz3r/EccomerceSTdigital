"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types";

export function ProductCarousel({ title, products }: { title: string; products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Anterior"
            className="flex size-10 items-center justify-center rounded-full border bg-background transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Siguiente"
            className="flex size-10 items-center justify-center rounded-full bg-brand-ink text-white transition-colors hover:bg-brand-ink-soft"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="scrollbar-none -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[78%] shrink-0 snap-start sm:w-[45%] md:w-[31%] lg:w-[23.5%] xl:w-[19%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
