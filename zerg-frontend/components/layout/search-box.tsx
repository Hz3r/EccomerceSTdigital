"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search, SearchX, X } from "lucide-react";
import { ProductCover } from "@/components/product/product-cover";
import { CategoryIcon } from "@/components/product/category-icon";
import { useCatalog } from "@/hooks/useCatalog";
import { useSite } from "@/hooks/useSiteSettings";
import { activePlans, cheapestPlan, discountPercent, formatPrice, matchesQuery, normalizeText } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const MAX_RESULTS = 8;

// Letra sin tilde y en minúscula, conservando la longitud para poder resaltar sobre el texto original.
const fold = (c: string) => {
  const f = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return f.length === 1 ? f : c.toLowerCase();
};

// Resalta las palabras buscadas dentro del nombre (sin importar tildes ni mayúsculas).
function Highlight({ text, query }: { text: string; query: string }) {
  const chars = [...text];
  const folded = chars.map(fold).join("");
  const marked = new Array(chars.length).fill(false);
  for (const word of normalizeText(query).split(/\s+/).filter(Boolean)) {
    for (let i = folded.indexOf(word); i !== -1; i = folded.indexOf(word, i + 1)) {
      for (let j = i; j < i + word.length; j++) marked[j] = true;
    }
  }
  const parts: { text: string; mark: boolean }[] = [];
  chars.forEach((c, i) => {
    const last = parts[parts.length - 1];
    if (last && last.mark === marked[i]) last.text += c;
    else parts.push({ text: c, mark: marked[i] });
  });
  return (
    <>
      {parts.map((p, i) =>
        p.mark ? (
          <mark key={i} className="rounded-sm bg-brand/20 px-px text-inherit">
            {p.text}
          </mark>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        )
      )}
    </>
  );
}

// Primero los que empiezan con lo buscado, luego los que lo contienen en el nombre y al final el resto.
function rank(product: Product, query: string) {
  const name = normalizeText(product.nombre);
  const q = normalizeText(query);
  if (name.startsWith(q)) return 0;
  if (name.includes(q)) return 1;
  return 2;
}

/**
 * Buscador del header con resultados mientras se escribe (como un autocompletado).
 * Enter abre el resultado resaltado o, si no hay ninguno, la página de resultados.
 */
export function SearchBox({ className, inputRef }: { className?: string; inputRef?: React.Ref<HTMLInputElement> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { header } = useSite().settings;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [touched, setTouched] = useState(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const listId = useId();

  // El catálogo se pide recién al usar el buscador (y queda en caché para la página de productos).
  const { products, categories, isLoading } = useCatalog({ enabled: touched });

  const q = query.trim();
  const results = useMemo(() => {
    if (!q) return [];
    return products
      .filter((p) => matchesQuery(p, q))
      .sort((a, b) => rank(a, q) - rank(b, q) || a.nombre.localeCompare(b.nombre));
  }, [products, q]);
  const matchingCategories = useMemo(
    () => (q ? categories.filter((c) => normalizeText(c.nombre).includes(normalizeText(q))).slice(0, 4) : []),
    [categories, q]
  );
  const shown = results.slice(0, MAX_RESULTS);
  const resultsHref = `/products?q=${encodeURIComponent(q)}`;
  const showPanel = open && q.length > 0;

  // Al navegar (resultado, categoría o "ver todos") se cierra y se limpia
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setOpen(false);
      setActive(-1);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (shown.length === 0) return;
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % shown.length : (i <= 0 ? shown.length : i) - 1));
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      } else {
        setQuery("");
      }
    }
  };

  return (
    <form
      ref={rootRef}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (showPanel && active >= 0 && shown[active]) go(`/product/${shown[active].slug}`);
        else go(q ? resultsHref : "/products");
      }}
      className={cn("relative", className)}
    >
      <div
        className={cn(
          "group flex h-11 items-center gap-2 rounded-xl border border-transparent bg-muted px-3.5 transition-colors focus-within:border-brand/50 focus-within:bg-background focus-within:ring-3 focus-within:ring-brand/15",
          showPanel && "border-brand/50 bg-background"
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => {
            setTouched(true);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={header.buscadorPlaceholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => {
              setQuery("");
              setActive(-1);
            }}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="hidden items-center gap-0.5 rounded-md border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline-flex">
            Ctrl K
          </kbd>
        )}
      </div>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/5 animate-in fade-in-0 slide-in-from-top-1 duration-150 md:min-w-[30rem]">
          {isLoading && products.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Buscando…
            </div>
          ) : (
            <>
              {matchingCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-b px-3 py-2.5">
                  {matchingCategories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/products?categoria=${c.slug}`}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium transition-colors hover:bg-brand/15 hover:text-brand-strong"
                    >
                      <CategoryIcon slug={c.slug} className="size-3.5" />
                      {c.nombre}
                    </Link>
                  ))}
                </div>
              )}

              {shown.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-8 text-center">
                  <SearchX className="size-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-semibold">Sin resultados para “{q}”</p>
                  <p className="mt-1 text-xs text-muted-foreground">Prueba con otro nombre, por ejemplo Netflix, Spotify o Canva.</p>
                </div>
              ) : (
                <ul id={listId} role="listbox" aria-label="Resultados" className="max-h-[min(28rem,65vh)] divide-y overflow-y-auto">
                  {shown.map((p, i) => {
                    const plan = cheapestPlan(p);
                    const inStock = activePlans(p).length > 0;
                    const discount = plan ? discountPercent(plan) : 0;
                    return (
                      <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={active === i}>
                        <Link
                          href={`/product/${p.slug}`}
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                          }}
                          onMouseEnter={() => setActive(i)}
                          className={cn("flex items-center gap-3 px-3 py-2.5 transition-colors", active === i && "bg-muted")}
                        >
                          <ProductCover product={p} size="sm" showCategory={false} className="size-11 shrink-0 rounded-lg" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              <Highlight text={p.nombre} query={q} />
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">{p.category?.nombre ?? "Digital"}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className={cn("block text-[11px] font-semibold", inStock ? "text-brand-strong" : "text-destructive")}>
                              {inStock ? "Disponible" : "Sin stock"}
                            </span>
                            {plan && (
                              <span className="block text-sm">
                                <span className="text-xs text-muted-foreground">Desde </span>
                                <span className="font-bold">{formatPrice(plan.precio)}</span>
                                {discount > 0 && <span className="ml-1 text-[11px] font-semibold text-brand-strong">-{discount}%</span>}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              {results.length > 0 && (
                <Link
                  href={resultsHref}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center justify-between gap-2 border-t bg-muted/40 px-4 py-3 text-sm font-semibold text-brand-strong transition-colors hover:bg-muted"
                >
                  Ver {results.length === 1 ? "el resultado" : `los ${results.length} resultados`} para “{q}”
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
}
