"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GuideCard } from "@/components/help/guide-card";
import { HelpLoading, HelpNotFound, HelpPageView } from "@/components/help/help-page-view";
import { useGuides, useHelpPage } from "@/hooks/useHelpPage";

// Una guía del blog "¿Cómo comprar?" con sus videos, y otras guías para seguir leyendo.
export default function GuidePage() {
  const { guia } = useParams<{ guia: string }>();
  const { data, error } = useHelpPage(guia);
  const others = (useGuides().data ?? []).filter((g) => g.slug !== guia).slice(0, 3);
  if (error || (data && data.tipo !== "GUIA")) return <HelpNotFound error={error ?? "not-found"} />;
  if (!data) return <HelpLoading />;
  return (
    <HelpPageView
      page={data}
      eyebrow={
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Link href="/ayuda/como-comprar" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> ¿Cómo comprar?
          </Link>
          {!data.publicado && <span className="rounded-full bg-brand-yellow/25 px-2 py-0.5 text-xs font-semibold">Borrador · solo lo ves tú</span>}
        </div>
      }
    >
      {others.length > 0 && (
        <section className="mt-12 border-t pt-8">
          <h2 className="text-xl font-extrabold tracking-tight">Otras guías</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {others.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        </section>
      )}
    </HelpPageView>
  );
}
