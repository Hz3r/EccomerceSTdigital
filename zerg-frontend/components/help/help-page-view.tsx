"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBlocks, slugId } from "@/components/help/page-blocks";
import { useSite } from "@/hooks/useSiteSettings";
import { fillTokens, type HelpPage } from "@/lib/help-pages";
import { assetUrl } from "@/lib/site-settings";

const dateFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "long" });

export function HelpLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function HelpNotFound({ error, back = "/ayuda/como-comprar" }: { error: "not-found" | "error"; back?: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-16 text-center">
      <SearchX className="size-10 text-muted-foreground/60" />
      <p className="mt-4 text-lg font-bold">{error === "not-found" ? "No encontramos esta página" : "No pudimos cargar esta página"}</p>
      <p className="mt-1 text-sm text-muted-foreground">{error === "not-found" ? "Puede que la hayan movido o despublicado." : "Intenta de nuevo en unos segundos."}</p>
      <Button variant="outline" className="mt-6 rounded-xl" render={<Link href={back} />} nativeButton={false}>
        <ArrowLeft className="size-4" />
        Volver a la ayuda
      </Button>
    </div>
  );
}

/** Encabezado, índice (en páginas largas) y contenido de una página de ayuda. */
export function HelpPageView({ page, children, eyebrow }: { page: HelpPage; children?: React.ReactNode; eyebrow?: React.ReactNode }) {
  const { settings } = useSite();
  const t = (text: string) => fillTokens(text, settings);
  const headings = page.bloques.flatMap((b) => (b.tipo === "titulo" ? [t(b.texto)] : b.tipo === "faq" && b.titulo ? [t(b.titulo)] : []));

  return (
    <article>
      <header className="border-b pb-6">
        {eyebrow}
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t(page.titulo)}</h1>
        {page.resumen && <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{t(page.resumen)}</p>}
        {page.actualizado && page.tipo === "PAGINA" && (
          <p className="mt-3 text-xs text-muted-foreground">Actualizado el {dateFormat.format(new Date(page.actualizado))}</p>
        )}
      </header>

      {page.portadaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assetUrl(page.portadaUrl)} alt="" className="mt-6 aspect-[21/9] w-full rounded-3xl border object-cover" />
      )}

      {headings.length >= 4 && (
        <nav aria-label="En esta página" className="mt-6 rounded-2xl bg-muted/50 p-4">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">En esta página</p>
          <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {headings.map((h) => (
              <li key={h}>
                <a href={`#${slugId(h)}`} className="text-muted-foreground transition-colors hover:text-brand-strong">
                  {h}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="mt-8 max-w-3xl">
        <PageBlocks blocks={page.bloques} />
      </div>
      {children}
    </article>
  );
}
