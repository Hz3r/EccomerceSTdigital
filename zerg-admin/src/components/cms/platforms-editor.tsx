"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageThumbField } from "@/components/image-field";
import { ListControls, moveItem, removeItem, replaceItem } from "@/components/cms/list-controls";
import type { Plataforma } from "@/types";

const MAX = 40;

// Plataformas de la marquesina: cada una con su nombre y, opcionalmente, un logo.
export function PlatformsEditor({ value, onChange }: { value: Plataforma[]; onChange: (v: Plataforma[]) => void }) {
  const [name, setName] = React.useState("");
  const add = () => {
    const nombre = name.trim();
    if (!nombre || value.length >= MAX) return;
    onChange([...value, { nombre, logoUrl: "" }]);
    setName("");
  };

  return (
    <div className="rounded-xl border">
      <ol className="scrollbar-thin max-h-[26rem] divide-y overflow-y-auto">
        {value.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">Sin plataformas.</li>}
        {value.map((p, i) => (
          <li key={i} className="flex items-center gap-3 px-3 py-2">
            <ImageThumbField
              value={p.logoUrl}
              onChange={(logoUrl) => onChange(replaceItem(value, i, { logoUrl }))}
              folder="branding"
              label="Logo"
              className="h-10 w-16"
            />
            <div className="min-w-0 flex-1">
              <Input
                value={p.nombre}
                aria-label="Nombre de la plataforma"
                onChange={(e) => onChange(replaceItem(value, i, { nombre: e.target.value }))}
                className="h-8"
              />
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {p.logoUrl ? "Se muestra el logo (el nombre queda como texto alternativo)" : "Se muestra el nombre como texto"}
              </p>
            </div>
            <ListControls
              index={i}
              length={value.length}
              label={p.nombre}
              onMove={(dir) => onChange(moveItem(value, i, dir))}
              onRemove={() => onChange(removeItem(value, i))}
            />
          </li>
        ))}
      </ol>
      <div className="flex gap-2 border-t p-3">
        <Input
          value={name}
          placeholder="Ej. Netflix"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="h-8"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={value.length >= MAX}>
          <Plus className="size-3.5" />
          Agregar
        </Button>
      </div>
    </div>
  );
}
