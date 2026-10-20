"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Utilidades para editar listas sin mutar el estado.
export function moveItem<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const next = [...list];
  [next[i], next[i + dir]] = [next[i + dir], next[i]];
  return next;
}

export function replaceItem<T>(list: T[], i: number, patch: Partial<T>): T[] {
  return list.map((item, j) => (j === i ? { ...item, ...patch } : item));
}

export function removeItem<T>(list: T[], i: number): T[] {
  return list.filter((_, j) => j !== i);
}

// Botones subir / bajar / quitar de un elemento de lista.
export function ListControls({ index, length, onMove, onRemove, label, className }: {
  index: number;
  length: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  label: string;
  className?: string;
}) {
  const btn = "rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className={cn("flex shrink-0 items-center", className)}>
      <button type="button" aria-label={`Subir ${label}`} disabled={index === 0} onClick={() => onMove(-1)} className={btn}>
        <ArrowUp className="size-3.5" />
      </button>
      <button type="button" aria-label={`Bajar ${label}`} disabled={index === length - 1} onClick={() => onMove(1)} className={btn}>
        <ArrowDown className="size-3.5" />
      </button>
      <button type="button" aria-label={`Quitar ${label}`} onClick={onRemove} className={cn(btn, "hover:text-destructive")}>
        <X className="size-3.5" />
      </button>
    </div>
  );
}
