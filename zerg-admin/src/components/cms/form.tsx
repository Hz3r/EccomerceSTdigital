"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Check, ExternalLink, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STORE_URL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageIntro({ title, description, storePath = "/" }: { title: string; description: string; storePath?: string }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      <a
        href={`${STORE_URL}${storePath}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 w-fit items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors hover:border-brand"
      >
        <ExternalLink className="size-3.5" />
        Ver en la tienda
      </a>
    </div>
  );
}

export function Section({ title, description, children, aside }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 className="font-bold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({ id, label, hint, value, onChange, placeholder, multiline }: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      ) : (
        <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-muted ring-1 ring-border transition-colors peer-checked:bg-brand peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50" />
        <span className="absolute left-0.5 size-5 rounded-full bg-background shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

// Lista de textos libres (ej. métodos de pago, plataformas).
export function TagsInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = React.useState("");
  const add = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  };
  return (
    <div className="rounded-xl border p-3">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pr-1.5 pl-3 text-xs font-medium">
            {tag}
            <button type="button" aria-label={`Quitar ${tag}`} onClick={() => onChange(value.filter((v) => v !== tag))} className="rounded-full p-0.5 hover:bg-background">
              <X className="size-3" />
            </button>
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-muted-foreground">Sin elementos.</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="h-8"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-3.5" />
          Agregar
        </Button>
      </div>
    </div>
  );
}

export interface PickOption {
  value: string;
  label: string;
  hint?: string;
}

// Selección ordenada desde una lista conocida (categorías, productos). El orden importa en la tienda.
export function OrderedPicker({ options, value, onChange, max, emptyLabel }: {
  options: PickOption[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  emptyLabel?: string;
}) {
  const [query, setQuery] = React.useState("");
  const selected = value.map((v) => options.find((o) => o.value === v) ?? { value: v, label: v, hint: "No encontrado" });
  const available = options
    .filter((o) => !value.includes(o.value))
    .filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 30);
  const full = max !== undefined && value.length >= max;
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-xl border">
        <p className="border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
          Seleccionados {max ? `(${value.length}/${max})` : `(${value.length})`}
        </p>
        <ol className="max-h-72 space-y-1 overflow-y-auto p-2">
          {selected.length === 0 && <li className="px-2 py-6 text-center text-xs text-muted-foreground">{emptyLabel ?? "Nada seleccionado."}</li>}
          {selected.map((o, i) => (
            <li key={o.value} className="flex items-center gap-2 rounded-lg bg-muted/60 px-2 py-1.5 text-sm">
              <span className="w-5 text-center text-xs font-bold text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{o.label}</span>
                {o.hint && <span className="block truncate text-[11px] text-muted-foreground">{o.hint}</span>}
              </span>
              <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 hover:bg-background disabled:opacity-30">
                <ArrowUp className="size-3.5" />
              </button>
              <button type="button" aria-label="Bajar" disabled={i === selected.length - 1} onClick={() => move(i, 1)} className="rounded p-1 hover:bg-background disabled:opacity-30">
                <ArrowDown className="size-3.5" />
              </button>
              <button type="button" aria-label={`Quitar ${o.label}`} onClick={() => onChange(value.filter((v) => v !== o.value))} className="rounded p-1 hover:bg-background">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-xl border">
        <div className="border-b p-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar para agregar..." className="h-8" />
        </div>
        <ul className="max-h-64 space-y-0.5 overflow-y-auto p-2">
          {available.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                disabled={full}
                onClick={() => onChange([...value, o.value])}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-3.5 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="truncate text-[11px] text-muted-foreground">{o.hint}</span>}
              </button>
            </li>
          ))}
          {available.length === 0 && <li className="px-2 py-4 text-center text-xs text-muted-foreground">Sin resultados.</li>}
        </ul>
      </div>
    </div>
  );
}

// Barra fija para guardar los cambios de una página de contenido.
export function SaveBar({ dirty, saving, savedAt, error, onSave, onDiscard }: {
  dirty: boolean;
  saving: boolean;
  savedAt: Date | null;
  error: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-4 z-20 flex items-center gap-3 rounded-2xl border bg-popover/95 px-4 py-3 shadow-xl backdrop-blur transition-all",
        dirty || error ? "border-brand/50" : ""
      )}
    >
      <p className="flex-1 text-sm">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : dirty ? (
          <span className="font-medium">Tienes cambios sin guardar</span>
        ) : savedAt ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Check className="size-4 text-brand" /> Guardado. La tienda ya muestra los cambios.
          </span>
        ) : (
          <span className="text-muted-foreground">Los cambios se publican en la tienda al guardar.</span>
        )}
      </p>
      <Button variant="outline" size="sm" disabled={!dirty || saving} onClick={onDiscard}>
        Descartar
      </Button>
      <Button size="sm" disabled={!dirty || saving} onClick={onSave}>
        {saving && <Loader2 className="size-3.5 animate-spin" />}
        Guardar cambios
      </Button>
    </div>
  );
}

export function SettingsState({ status }: { status: "loading" | "error" }) {
  return status === "loading" ? (
    <div className="flex h-60 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  ) : (
    <div className="rounded-2xl border border-dashed p-10 text-center text-sm">
      <p className="font-semibold">No se pudo cargar el contenido</p>
      <p className="mt-1 text-muted-foreground">
        Revisa que el backend esté encendido. <Link href="/" className="underline">Volver al dashboard</Link>
      </p>
    </div>
  );
}
