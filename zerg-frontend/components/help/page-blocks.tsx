"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, Info, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/help/rich-text";
import { useSite } from "@/hooks/useSiteSettings";
import { fillTokens, videoSource, type HelpBlock } from "@/lib/help-pages";
import { assetUrl } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

export const slugId = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const source = videoSource(url);
  if (source.kind === "link") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border bg-card p-4 font-semibold transition-colors hover:border-brand/50">
        <PlayCircle className="size-8 text-brand-strong" />
        {title || "Ver video"}
      </a>
    );
  }
  return (
    <figure className="space-y-2">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-black shadow-sm",
          source.kind === "iframe" && source.vertical ? "mx-auto aspect-[9/16] max-w-xs" : "aspect-video"
        )}
      >
        {source.kind === "file" ? (
          <video src={assetUrl(source.src)} controls playsInline preload="metadata" className="size-full" aria-label={title || "Video"} />
        ) : (
          <iframe
            src={source.src}
            title={title || "Video"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="size-full"
          />
        )}
      </div>
      {title && <figcaption className="text-center text-sm text-muted-foreground">{title}</figcaption>}
    </figure>
  );
}

const AVISO = {
  info: { icon: Info, className: "border-sky-500/30 bg-sky-500/10" },
  alerta: { icon: AlertTriangle, className: "border-brand-yellow/50 bg-brand-yellow/15" },
  exito: { icon: CheckCircle2, className: "border-brand/40 bg-brand-mint" },
};

/** Contenido de una página de ayuda o guía, bloque por bloque. */
export function PageBlocks({ blocks }: { blocks: HelpBlock[] }) {
  const { settings } = useSite();
  const t = (text: string) => fillTokens(text, settings);

  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        switch (b.tipo) {
          case "titulo":
            return (
              <h2 key={i} id={slugId(t(b.texto))} className="scroll-mt-32 pt-2 text-2xl font-extrabold tracking-tight">
                {t(b.texto)}
              </h2>
            );
          case "texto":
            return <RichText key={i} text={t(b.texto)} />;
          case "video":
            return <VideoEmbed key={i} url={b.url} title={t(b.titulo)} />;
          case "imagen":
            return (
              <figure key={i} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(b.url)} alt={t(b.alt || b.pie)} loading="lazy" className="w-full rounded-2xl border object-cover" />
                {b.pie && <figcaption className="text-center text-sm text-muted-foreground">{t(b.pie)}</figcaption>}
              </figure>
            );
          case "pasos":
            return (
              <ol key={i} className="grid gap-3 sm:grid-cols-2">
                {b.items.map((step, j) => (
                  <li key={j} className="flex gap-4 rounded-2xl border bg-card p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-black text-brand-ink">{j + 1}</span>
                    <div className="min-w-0">
                      {step.titulo && <p className="font-bold">{t(step.titulo)}</p>}
                      {step.texto && <RichText text={t(step.texto)} className="mt-1 text-sm" />}
                    </div>
                  </li>
                ))}
              </ol>
            );
          case "faq":
            return (
              <section key={i} className="space-y-3">
                {b.titulo && (
                  <h2 id={slugId(t(b.titulo))} className="scroll-mt-32 text-xl font-extrabold tracking-tight">
                    {t(b.titulo)}
                  </h2>
                )}
                <div className="divide-y rounded-2xl border bg-card">
                  {b.items.map((f, j) => (
                    <details key={j} className="group px-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                        {t(f.pregunta)}
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <RichText text={t(f.respuesta)} className="pb-4 text-sm" />
                    </details>
                  ))}
                </div>
              </section>
            );
          case "aviso": {
            const meta = AVISO[b.variante] ?? AVISO.info;
            return (
              <div key={i} className={cn("flex gap-3 rounded-2xl border p-4 text-sm", meta.className)}>
                <meta.icon className="mt-0.5 size-5 shrink-0" />
                <RichText text={t(b.texto)} className="text-foreground" />
              </div>
            );
          }
          case "boton":
            return (
              <div key={i}>
                <Button
                  className="h-11 rounded-xl px-5"
                  render={b.url.startsWith("/") ? <Link href={b.url} /> : <a href={b.url} target="_blank" rel="noreferrer" />}
                  nativeButton={false}
                >
                  {t(b.texto)}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
