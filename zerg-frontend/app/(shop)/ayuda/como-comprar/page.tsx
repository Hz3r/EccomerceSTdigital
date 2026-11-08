"use client";

import { GuideCard } from "@/components/help/guide-card";
import { HelpLoading, HelpNotFound, HelpPageView } from "@/components/help/help-page-view";
import { useGuides, useHelpPage } from "@/hooks/useHelpPage";

// "¿Cómo comprar?": la guía principal y, debajo, el blog de guías y videos que publica el admin.
export default function HowToBuyPage() {
  const { data, error } = useHelpPage("como-comprar");
  const guides = useGuides().data ?? [];
  if (error) return <HelpNotFound error={error} />;
  if (!data) return <HelpLoading />;
  return (
    <HelpPageView page={data}>
      {guides.length > 0 && (
        <section className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-extrabold tracking-tight">Guías y videos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tutoriales paso a paso para sacarle el máximo a tus servicios.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {guides.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        </section>
      )}
    </HelpPageView>
  );
}
