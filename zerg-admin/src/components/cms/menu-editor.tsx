"use client";

import * as React from "react";
import { ChevronDown, Columns3, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageThumbField } from "@/components/image-field";
import { Field, Toggle, type PickOption } from "@/components/cms/form";
import { ListControls, moveItem, removeItem, replaceItem } from "@/components/cms/list-controls";
import { cn } from "@/lib/utils";
import type { MenuGroup, MenuItem, MenuLink } from "@/types";

const MAX_ITEMS = 12;
const MAX_GROUPS = 6;
const MAX_LINKS = 30;
const URL_OPTIONS_ID = "menu-url-options";

const emptyItem = (patch: Partial<MenuItem> = {}): MenuItem => ({ etiqueta: "", categoria: "", url: "", desplegable: false, grupos: [], ...patch });
const emptyGroup = (): MenuGroup => ({ titulo: "", enlaces: [] });
const emptyLink = (patch: Partial<MenuLink> = {}): MenuLink => ({ etiqueta: "", url: "", imagenUrl: "", ...patch });

const selectClass = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30";

// Menú del header: enlaces simples o desplegables con columnas de subenlaces.
export function MenuEditor({ value, onChange, categories, products }: {
  value: MenuItem[];
  onChange: (v: MenuItem[]) => void;
  categories: PickOption[];
  products: PickOption[];
}) {
  const [open, setOpen] = React.useState<number | null>(null);
  const categoryName = (slug: string) => categories.find((c) => c.value === slug)?.label ?? slug;
  const add = (item: MenuItem) => {
    onChange([...value, item]);
    setOpen(value.length);
  };

  return (
    <div className="space-y-3">
      {/* Sugerencias para los campos de enlace: categorías y productos de la tienda */}
      <datalist id={URL_OPTIONS_ID}>
        <option value="/products">Todos los productos</option>
        <option value="/products?ofertas=1">Ofertas</option>
        {categories.map((c) => (
          <option key={c.value} value={`/products?categoria=${c.value}`}>{`Categoría: ${c.label}`}</option>
        ))}
        {products.map((p) => (
          <option key={p.value} value={`/product/${p.value}`}>{p.label}</option>
        ))}
      </datalist>

      <ol className="space-y-2">
        {value.length === 0 && (
          <li className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
            El menú está vacío: solo se mostrará “Todos los productos”.
          </li>
        )}
        {value.map((item, i) => {
          const label = item.etiqueta || (item.categoria ? categoryName(item.categoria) : "") || "Sin texto";
          const expanded = open === i;
          const set = (patch: Partial<MenuItem>) => onChange(replaceItem(value, i, patch));
          return (
            <li key={i} className={cn("rounded-xl border bg-card transition-colors", expanded && "border-brand/50")}>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : i)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left"
                >
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {item.categoria ? `Categoría · ${categoryName(item.categoria)}` : item.url || "Sin enlace"}
                    </span>
                  </span>
                  {item.desplegable && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand-strong">
                      <Columns3 className="size-3" />
                      Desplegable · {item.grupos.reduce((n, g) => n + g.enlaces.length, 0)}
                    </span>
                  )}
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                </button>
                <ListControls
                  index={i}
                  length={value.length}
                  label={label}
                  onMove={(dir) => {
                    onChange(moveItem(value, i, dir));
                    if (expanded) setOpen(i + dir);
                  }}
                  onRemove={() => {
                    onChange(removeItem(value, i));
                    setOpen(null);
                  }}
                />
              </div>

              {expanded && (
                <div className="space-y-4 border-t p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Destino" htmlFor={`menu-${i}-destino`}>
                      <select
                        id={`menu-${i}-destino`}
                        value={item.categoria}
                        onChange={(e) => set({ categoria: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">Enlace personalizado</option>
                        {!item.categoria || categories.some((c) => c.value === item.categoria) ? null : (
                          <option value={item.categoria}>{item.categoria} (no encontrada)</option>
                        )}
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>
                            Categoría: {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Texto"
                      htmlFor={`menu-${i}-texto`}
                      hint={item.categoria ? "Vacío = nombre de la categoría." : undefined}
                    >
                      <Input
                        id={`menu-${i}-texto`}
                        value={item.etiqueta}
                        placeholder={item.categoria ? categoryName(item.categoria) : "Ej. Tarjetas de regalo"}
                        onChange={(e) => set({ etiqueta: e.target.value })}
                        className="h-8"
                      />
                    </Field>
                  </div>
                  {!item.categoria && (
                    <Field
                      label="Enlace"
                      htmlFor={`menu-${i}-url`}
                      hint={item.desplegable ? "Opcional: se muestra como “Ver todo” dentro del desplegable." : "Ruta de la tienda (/products?q=...) o URL completa."}
                    >
                      <Input
                        id={`menu-${i}-url`}
                        list={URL_OPTIONS_ID}
                        value={item.url}
                        placeholder="/products?q=steam"
                        onChange={(e) => set({ url: e.target.value })}
                        className="h-8"
                      />
                    </Field>
                  )}
                  <Toggle
                    label="Menú desplegable"
                    hint="Muestra columnas de subenlaces: un panel al pasar el mouse en escritorio y un acordeón en el celular."
                    checked={item.desplegable}
                    onChange={(desplegable) =>
                      set({ desplegable, grupos: desplegable && item.grupos.length === 0 ? [emptyGroup()] : item.grupos })
                    }
                  />
                  {item.desplegable && (
                    <GroupsEditor value={item.grupos} onChange={(grupos) => set({ grupos })} products={products} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Agregar categoría al menú"
          value=""
          disabled={value.length >= MAX_ITEMS}
          onChange={(e) => e.target.value && add(emptyItem({ categoria: e.target.value }))}
          className={cn(selectClass, "w-auto")}
        >
          <option value="">+ Agregar categoría</option>
          {categories
            .filter((c) => !value.some((m) => m.categoria === c.value))
            .map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
        </select>
        <Button type="button" variant="outline" size="sm" disabled={value.length >= MAX_ITEMS} onClick={() => add(emptyItem())}>
          <Link2 className="size-3.5" />
          Enlace
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value.length >= MAX_ITEMS}
          onClick={() => add(emptyItem({ etiqueta: "Nuevo menú", desplegable: true, grupos: [emptyGroup()] }))}
        >
          <Columns3 className="size-3.5" />
          Desplegable
        </Button>
        <span className="ml-auto self-center text-[11px] text-muted-foreground">
          {value.length}/{MAX_ITEMS}
        </span>
      </div>
    </div>
  );
}

// Columnas de un desplegable, cada una con su título y sus enlaces.
function GroupsEditor({ value, onChange, products }: { value: MenuGroup[]; onChange: (v: MenuGroup[]) => void; products: PickOption[] }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        {value.map((group, gi) => {
          const setGroup = (patch: Partial<MenuGroup>) => onChange(replaceItem(value, gi, patch));
          const links = group.enlaces;
          const full = links.length >= MAX_LINKS;
          return (
            <div key={gi} className="rounded-xl border bg-muted/30">
              <div className="flex items-center gap-2 border-b p-2">
                <Input
                  value={group.titulo}
                  aria-label="Título de la columna"
                  placeholder={`Columna ${gi + 1} (título opcional)`}
                  onChange={(e) => setGroup({ titulo: e.target.value })}
                  className="h-8 bg-background font-semibold"
                />
                <ListControls
                  index={gi}
                  length={value.length}
                  label={group.titulo || `columna ${gi + 1}`}
                  onMove={(dir) => onChange(moveItem(value, gi, dir))}
                  onRemove={() => onChange(removeItem(value, gi))}
                />
              </div>
              <ol className="scrollbar-thin max-h-80 space-y-1.5 overflow-y-auto p-2">
                {links.length === 0 && <li className="py-3 text-center text-xs text-muted-foreground">Sin enlaces.</li>}
                {links.map((link, li) => (
                  <li key={li} className="flex items-center gap-2 rounded-lg bg-background p-1.5">
                    <ImageThumbField
                      value={link.imagenUrl}
                      onChange={(imagenUrl) => setGroup({ enlaces: replaceItem(links, li, { imagenUrl }) })}
                      folder="branding"
                      label="Ícono"
                      className="size-9"
                    />
                    <div className="grid min-w-0 flex-1 gap-1">
                      <Input
                        value={link.etiqueta}
                        aria-label="Texto del enlace"
                        placeholder="Texto"
                        onChange={(e) => setGroup({ enlaces: replaceItem(links, li, { etiqueta: e.target.value }) })}
                        className="h-7 text-xs"
                      />
                      <Input
                        value={link.url}
                        list={URL_OPTIONS_ID}
                        aria-label="Enlace"
                        placeholder="/product/... o https://..."
                        onChange={(e) => setGroup({ enlaces: replaceItem(links, li, { url: e.target.value }) })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <ListControls
                      index={li}
                      length={links.length}
                      label={link.etiqueta || "enlace"}
                      onMove={(dir) => setGroup({ enlaces: moveItem(links, li, dir) })}
                      onRemove={() => setGroup({ enlaces: removeItem(links, li) })}
                      className="flex-col sm:flex-row"
                    />
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2 border-t p-2">
                <Button type="button" variant="outline" size="sm" disabled={full} onClick={() => setGroup({ enlaces: [...links, emptyLink()] })}>
                  <Plus className="size-3.5" />
                  Enlace
                </Button>
                {products.length > 0 && (
                  <select
                    aria-label="Agregar producto como enlace"
                    value=""
                    disabled={full}
                    onChange={(e) => {
                      const p = products.find((o) => o.value === e.target.value);
                      if (p) setGroup({ enlaces: [...links, emptyLink({ etiqueta: p.label, url: `/product/${p.value}` })] });
                    }}
                    className={cn(selectClass, "h-7 min-w-0 flex-1 text-xs")}
                  >
                    <option value="">+ Agregar producto…</option>
                    {products.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                        {p.hint ? ` · ${p.hint}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Button type="button" variant="ghost" size="sm" disabled={value.length >= MAX_GROUPS} onClick={() => onChange([...value, emptyGroup()])}>
        <Columns3 className="size-3.5" />
        Agregar columna ({value.length}/{MAX_GROUPS})
      </Button>
    </div>
  );
}
