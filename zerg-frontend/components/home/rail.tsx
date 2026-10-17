"use client";

import { Children, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";

// Fila horizontal con desplazamiento por flechas (carrusel ligero sin dependencias).
export function Rail({
  title,
  subtitle,
  href,
  itemClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  itemClassName?: string;
  children: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} href={href}>
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
          className="flex size-10 items-center justify-center rounded-full bg-surface-ink text-white transition-colors hover:bg-surface-ink-hover dark:bg-brand dark:text-brand-ink dark:hover:bg-brand-bright"
        >
          <ArrowRight className="size-4" />
        </button>
      </SectionHeader>

      <div
        ref={trackRef}
        className="scrollbar-none -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6"
      >
        {Children.map(children, (child) => (
          <div className={cn("shrink-0 snap-start", itemClassName)}>{child}</div>
        ))}
      </div>
    </section>
  );
}
