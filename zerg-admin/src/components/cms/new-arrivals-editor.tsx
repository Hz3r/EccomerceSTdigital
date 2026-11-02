"use client";

import * as React from "react";
import { Briefcase, Gamepad2, Music, Palette, Plus, ShieldCheck, Sparkles, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, OrderedPicker, type PickOption } from "@/components/cms/form";
import { ListControls, moveItem, removeItem, replaceItem } from "@/components/cms/list-controls";
import { cn } from "@/lib/utils";
import type { ColumnaRecientes } from "@/types";

const MAX_COLUMNS = 4;

// Mismos íconos y colores que usa la tienda (zerg-frontend/components/home/new-arrivals.tsx).
const ICONS: { value: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "ia", label: "IA", Icon: Sparkles },
  { value: "streaming", label: "Streaming", Icon: Tv },
  { value: "musica", label: "Música", Icon: Music },
  { value: "diseno", label: "Diseño", Icon: Palette },
  { value: "productividad", label: "Productividad", Icon: Briefcase },
  { value: "gaming", label: "Gaming", Icon: Gamepad2 },
  { value: "seguridad", label: "Seguridad", Icon: ShieldCheck },
];

const COLORS: { value: string; label: string; css: string }[] = [
  { value: "verde", label: "Verde", css: "#05c48a" },
  { value: "amarillo", label: "Amarillo", css: "#ffd000" },
  { value: "neon", label: "Neón", css: "#01f1c4" },
  { value: "azul", label: "Azul", css: "#3b82f6" },
  { value: "morado", label: "Morado", css: "#8b5cf6" },
  { value: "rosa", label: "Rosa", css: "#ec4899" },
  { value: "naranja", label: "Naranja", css: "#f97316" },
  { value: "rojo", label: "Rojo", css: "#ef4444" },
];

const emptyColumn = (): ColumnaRecientes => ({ titulo: "Nueva columna", icono: "", color: "verde", categorias: [], productos: [] });

// Columnas de "Recién llegados": título, ícono, color, categorías y (opcional) productos elegidos a mano.
export function NewArrivalsEditor({ value, onChange, categories, products }: {
  value: ColumnaRecientes[];
  onChange: (v: ColumnaRecientes[]) => void;
  categories: PickOption[];
  products: PickOption[];
}) {
  const set = (i: number, patch: Partial<ColumnaRecientes>) => onChange(replaceItem(value, i, patch));

  return (
    <div className="space-y-4">
      {value.length === 0 && (
        <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
          Sin columnas: la sección no se muestra en la tienda.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {value.map((col, i) => {
          const color = COLORS.find((c) => c.value === col.color) ?? COLORS[0];
          return (
            <div key={i} className="space-y-4 rounded-xl border border-t-4 p-4" style={{ borderTopColor: color.css }}>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Field label={`Columna ${i + 1}`} htmlFor={`recientes-titulo-${i}`}>
                    <Input id={`recientes-titulo-${i}`} value={col.titulo} onChange={(e) => set(i, { titulo: e.target.value })} />
                  </Field>
                </div>
                <ListControls
                  index={i}
                  length={value.length}
                  label={col.titulo}
                  className="pb-1.5"
                  onMove={(dir) => onChange(moveItem(value, i, dir))}
                  onRemove={() => onChange(removeItem(value, i))}
                />
              </div>

              <Field label="Ícono" hint="Sin elegir, se usa el de la primera categoría.">
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map(({ value: v, label, Icon }) => (
                    <button
                      key={v}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={col.icono === v}
                      onClick={() => set(i, { icono: col.icono === v ? "" : v })}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-muted",
                        col.icono === v && "border-primary bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Color del borde">
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      aria-label={c.label}
                      aria-pressed={col.color === c.value}
                      onClick={() => set(i, { color: c.value })}
                      className={cn(
                        "size-7 rounded-full border-2 border-transparent ring-offset-2 ring-offset-background transition",
                        col.color === c.value && "ring-2 ring-foreground"
                      )}
                      style={{ backgroundColor: c.css }}
                    />
                  ))}
                </div>
              </Field>

              <Field label="Categorías" hint="Se muestran los últimos productos agregados a estas categorías.">
                <div className="flex flex-wrap gap-1.5">
                  {categories.length === 0 && <span className="text-xs text-muted-foreground">Cargando categorías...</span>}
                  {categories.map((c) => {
                    const active = col.categorias.includes(c.value);
                    return (
                      <button
                        key={c.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          set(i, { categorias: active ? col.categorias.filter((v) => v !== c.value) : [...col.categorias, c.value] })
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted",
                          active && "border-primary bg-primary/10 font-medium text-primary"
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Productos elegidos a mano (opcional)" hint="Si eliges productos, se muestran estos en este orden en lugar de los automáticos.">
                <OrderedPicker
                  options={products}
                  value={col.productos}
                  onChange={(v) => set(i, { productos: v })}
                  max={12}
                  emptyLabel="Automático: los últimos de las categorías elegidas."
                />
              </Field>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, emptyColumn()])} disabled={value.length >= MAX_COLUMNS}>
        <Plus className="size-3.5" />
        Agregar columna {value.length >= MAX_COLUMNS && `(máx. ${MAX_COLUMNS})`}
      </Button>
    </div>
  );
}
