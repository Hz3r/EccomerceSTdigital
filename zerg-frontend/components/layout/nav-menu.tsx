"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CategoryIcon } from "@/components/product/category-icon";
import { assetUrl, safeHref, type MenuGroup, type MenuItem, type MenuLink } from "@/lib/site-settings";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export interface ResolvedMenuItem {
  key: string;
  label: string;
  href: string;
  slug?: string;
  groups: MenuGroup[];
}

// Completa cada elemento del menú con el nombre y el enlace de su categoría.
// Se omiten los que apuntan a una categoría que ya no existe o quedaron sin texto.
export function resolveMenu(menu: MenuItem[], categories: Category[]): ResolvedMenuItem[] {
  return menu.flatMap((item, i) => {
    const category = item.categoria ? categories.find((c) => c.slug === item.categoria) : undefined;
    if (item.categoria && !category) return [];
    const label = item.etiqueta || category?.nombre || "";
    if (!label) return [];
    const groups = item.desplegable
      ? item.grupos
          .map((g) => ({ ...g, enlaces: g.enlaces.filter((l) => l.etiqueta && safeHref(l.url)) }))
          .filter((g) => g.enlaces.length > 0)
      : [];
    return [{
      key: `${i}-${label}`,
      label,
      href: category ? `/products?categoria=${category.slug}` : safeHref(item.url),
      slug: category?.slug,
      groups,
    }];
  });
}

function LinkImage({ link, className }: { link: MenuLink; className?: string }) {
  if (!link.imagenUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={assetUrl(link.imagenUrl)} alt="" loading="lazy" className={cn("shrink-0 rounded-md object-contain", className)} />
  );
}

const itemClass =
  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

// Barra de categorías de escritorio. Los desplegables abren un panel ancho bajo la barra
// (al pasar el mouse o con clic/teclado), con una columna por grupo.
export function DesktopMenu({ items, className, children }: { items: ResolvedMenuItem[]; className?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = items.find((i) => i.key === open);

  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 150);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  useEffect(() => cancelClose, []);

  return (
    <div ref={rootRef} className={cn("relative", className)} onMouseLeave={scheduleClose} onMouseEnter={cancelClose}>
      <div className="scrollbar-none mx-auto flex h-12 max-w-7xl items-center gap-1 overflow-x-auto px-6">
        {children}
        {items.map((item) =>
          item.groups.length > 0 ? (
            <button
              key={item.key}
              type="button"
              aria-expanded={open === item.key}
              aria-haspopup="true"
              onMouseEnter={() => {
                cancelClose();
                setOpen(item.key);
              }}
              onClick={() => setOpen((o) => (o === item.key ? null : item.key))}
              className={cn(itemClass, open === item.key && "bg-muted text-foreground")}
            >
              {item.slug && <CategoryIcon slug={item.slug} className="size-3.5" />}
              {item.label}
              <ChevronDown className={cn("size-3.5 transition-transform", open === item.key && "rotate-180")} />
            </button>
          ) : item.href ? (
            <Link key={item.key} href={item.href} onMouseEnter={() => setOpen(null)} className={itemClass}>
              {item.slug && <CategoryIcon slug={item.slug} className="size-3.5" />}
              {item.label}
            </Link>
          ) : null
        )}
      </div>

      {active && (
        <div className="absolute inset-x-0 top-full z-50 border-y bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 slide-in-from-top-1">
          <div className="mx-auto max-h-[70vh] max-w-7xl overflow-y-auto px-6 py-6">
            <div className="grid gap-x-8 gap-y-6 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              {active.groups.map((group, gi) => (
                <div key={gi} className="min-w-0">
                  {group.titulo && (
                    <p className="mb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{group.titulo}</p>
                  )}
                  <ul className="divide-y">
                    {group.enlaces.map((link, li) => (
                      <li key={li}>
                        <Link
                          href={safeHref(link.url)}
                          onClick={() => setOpen(null)}
                          className="flex items-center gap-2.5 py-2 text-sm transition-colors hover:text-brand-strong"
                        >
                          <LinkImage link={link} className="size-7" />
                          <span className="min-w-0 truncate">{link.etiqueta}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {active.href && (
              <Link
                href={active.href}
                onClick={() => setOpen(null)}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline"
              >
                Ver todo en {active.label}
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const mobileLinkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground";

// Elemento del menú móvil: enlace simple o acordeón con sus grupos.
export function MobileMenuItem({ item, onNavigate }: { item: ResolvedMenuItem; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const icon = item.slug ? <CategoryIcon slug={item.slug} className="size-4" /> : null;

  if (item.groups.length === 0) {
    if (!item.href) return null;
    return (
      <Link href={item.href} onClick={onNavigate} className={mobileLinkClass}>
        {icon}
        {item.label}
      </Link>
    );
  }

  return (
    <MobileAccordion label={item.label} icon={icon} expanded={expanded} onToggle={() => setExpanded((e) => !e)}>
      {item.groups.map((group, gi) => (
        <div key={gi}>
          {group.titulo && <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{group.titulo}</p>}
          {group.enlaces.map((link, li) => (
            <Link key={li} href={safeHref(link.url)} onClick={onNavigate} className={cn(mobileLinkClass, "py-2 text-[13px]")}>
              <LinkImage link={link} className="size-5" />
              {link.etiqueta}
            </Link>
          ))}
        </div>
      ))}
      {item.href && (
        <Link href={item.href} onClick={onNavigate} className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-brand-strong">
          Ver todo
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </MobileAccordion>
  );
}

export function MobileAccordion({ label, icon, expanded, onToggle, children }: {
  label: string;
  icon?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={cn(mobileLinkClass, "w-full", expanded && "text-foreground")}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
      </button>
      <div className={cn("grid transition-[grid-template-rows] duration-200", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="ml-5 border-l pl-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
