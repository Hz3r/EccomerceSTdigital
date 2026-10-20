"use client";

import * as React from "react";
import { ChevronDown, Columns3, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageThumbField } from "@/components/image-field";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UrlField, type UrlOption } from "@/components/cms/url-field";
import { Field, Toggle, type PickOption } from "@/components/cms/form";
import { ListControls, moveItem, removeItem, replaceItem } from "@/components/cms/list-controls";
import { cn } from "@/lib/utils";
import type { MenuGroup, MenuItem, MenuLink } from "@/types";

const MAX_ITEMS = 12;
const MAX_GROUPS = 6;
const MAX_LINKS = 30;

const emptyItem = (patch: Partial<MenuItem> = {}): MenuItem => ({ etiqueta: "", categoria: "", url: "", desplegable: false, grupos: [], ...patch });
const emptyGroup = (): MenuGroup => ({ titulo: "", enlaces: [] });
const emptyLink = (patch: Partial<MenuLink> = {}): MenuLink => ({ etiqueta: "", url: "", imagenUrl: "", ...patch });

// Selector que no guarda un valor: elegir una opción ejecuta una acción (ej. agregar al menú).
function ActionSelect({ placeholder, options, onPick, disabled, size = "default", className }: {
  placeholder: string;
  options: PickOption[];
  onPick: (value: string) => void;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <Select value={null} onValueChange={(v) => v && onPick(v as string)} disabled={disabled || options.length === 0}>
      <SelectTrigger size={size} aria-label={placeholder} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-56">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <span className="truncate">{o.label}</span>
            {o.hint && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{o.hint}</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
  // Sugerencias para los campos de enlace: categorías y productos de la tienda
  const urlOptions: UrlOption[] = React.useMemo(
    () => [
      { url: "/products", label: "Todos los productos" },
      { url: "/products?ofertas=1", label: "Ofertas" },
      ...categories.map((c) => ({ url: `/products?categoria=${c.value}`, label: `Categoría: ${c.label}` })),
      ...products.map((p) => ({ url: `/product/${p.value}`, label: p.label })),
    ],
    [categories, products]
  );

  return (
    <div className="space-y-3">

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
                      <Select
                        value={item.categoria || null}
                        onValueChange={(v) => set({ categoria: (v as string | null) ?? "" })}
                        items={[
                          { value: null, label: "Enlace personalizado" },
                          ...(item.categoria && !categories.some((c) => c.value === item.categoria)
                            ? [{ value: item.categoria, label: `${item.categoria} (no encontrada)` }]
                            : []),
                          ...categories.map((c) => ({ value: c.value, label: `Categoría: ${c.label}` })),
                        ]}
                      >
                        <SelectTrigger id={`menu-${i}-destino`} className="w-full data-placeholder:text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>
                            <Link2 className="size-3.5 text-muted-foreground" />
                            Enlace personalizado
                          </SelectItem>
                          <SelectSeparator />
                          {item.categoria && !categories.some((c) => c.value === item.categoria) && (
                            <SelectItem value={item.categoria}>{item.categoria} (no encontrada)</SelectItem>
                          )}
                          {categories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              Categoría: {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <UrlField
                        id={`menu-${i}-url`}
                        value={item.url}
                        placeholder="/products?q=steam"
                        onChange={(url) => set({ url })}
                        options={urlOptions}
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
                    <GroupsEditor value={item.grupos} onChange={(grupos) => set({ grupos })} products={products} urlOptions={urlOptions} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        <ActionSelect
          placeholder="+ Agregar categoría"
          options={categories.filter((c) => !value.some((m) => m.categoria === c.value))}
          onPick={(categoria) => add(emptyItem({ categoria }))}
          disabled={value.length >= MAX_ITEMS}
        />
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
function GroupsEditor({ value, onChange, products, urlOptions }: {
  value: MenuGroup[];
  onChange: (v: MenuGroup[]) => void;
  products: PickOption[];
  urlOptions: UrlOption[];
}) {
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
                      <UrlField
                        value={link.url}
                        aria-label="Enlace"
                        placeholder="/product/... o https://..."
                        onChange={(url) => setGroup({ enlaces: replaceItem(links, li, { url }) })}
                        options={urlOptions}
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
                <ActionSelect
                  placeholder="+ Agregar producto…"
                  options={products}
                  disabled={full}
                  size="sm"
                  className="min-w-0 flex-1"
                  onPick={(slug) => {
                    const p = products.find((o) => o.value === slug);
                    if (p) setGroup({ enlaces: [...links, emptyLink({ etiqueta: p.label, url: `/product/${p.value}` })] });
                  }}
                />
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
