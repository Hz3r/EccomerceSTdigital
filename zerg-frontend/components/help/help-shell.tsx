"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, HelpCircle, Mail, MessageCircle, ShieldCheck, Lock } from "lucide-react";
import { useSite } from "@/hooks/useSiteSettings";
import { HELP_LINKS, helpHref } from "@/lib/help-pages";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof BookOpen> = {
  "como-comprar": BookOpen,
  "preguntas-frecuentes": HelpCircle,
  garantia: ShieldCheck,
  terminos: FileText,
  privacidad: Lock,
};

/** Centro de ayuda: menú de páginas (lateral en computadora, deslizable en el celular) y el contenido. */
export function HelpShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { contacto } = useSite().settings;
  const whatsapp = contacto.whatsapp.replace(/\D/g, "");
  const isActive = (slug: string) => pathname === helpHref(slug) || pathname.startsWith(`${helpHref(slug)}/`);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[250px_1fr] lg:gap-12">
        <aside className="min-w-0 lg:sticky lg:top-32 lg:self-start">
          <p className="hidden text-xs font-bold tracking-widest text-muted-foreground uppercase lg:block">Centro de ayuda</p>
          <nav aria-label="Páginas de ayuda" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:mt-3 lg:flex-col lg:gap-1 lg:px-0">
            {HELP_LINKS.map(({ slug, label }) => {
              const Icon = ICONS[slug] ?? FileText;
              const active = isActive(slug);
              return (
                <Link
                  key={slug}
                  href={helpHref(slug)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                    active ? "bg-brand/15 text-brand-strong" : "bg-muted text-muted-foreground hover:text-foreground lg:bg-transparent lg:hover:bg-muted"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 hidden rounded-2xl border bg-card p-4 lg:block">
            <p className="font-bold">¿Sigues con dudas?</p>
            <p className="mt-1 text-sm text-muted-foreground">Te respondemos {contacto.horario ? contacto.horario.toLowerCase() : "en minutos"}.</p>
            <div className="mt-3 space-y-2 text-sm">
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-brand-strong hover:underline">
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              )}
              {contacto.email && (
                <a href={`mailto:${contacto.email}`} className="flex items-center gap-2 font-semibold text-brand-strong hover:underline">
                  <Mail className="size-4" /> {contacto.email}
                </a>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
