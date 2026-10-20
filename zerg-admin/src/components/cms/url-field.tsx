"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { cn } from "@/lib/utils";

export interface UrlOption {
  url: string;
  label: string;
}

const matches = (o: UrlOption, query: string) => `${o.url} ${o.label}`.toLowerCase().includes(query.trim().toLowerCase());

// Campo de enlace con sugerencias (categorías, productos) que también acepta cualquier URL escrita a mano.
export function UrlField({ id, value, onChange, options, placeholder, className, "aria-label": ariaLabel }: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: UrlOption[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Autocomplete.Root
      items={options}
      value={value}
      onValueChange={(v) => onChange(v)}
      itemToStringValue={(o: UrlOption) => o.url}
      filter={matches}
      openOnInputClick
      limit={40}
    >
      <Autocomplete.Input
        id={id}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
          className
        )}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner className="isolate z-50 outline-none" sideOffset={4} align="start">
          <Autocomplete.Popup className="w-(--anchor-width) min-w-64 max-w-(--available-width) origin-(--transform-origin) rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Autocomplete.Empty>
              <p className="px-3 py-2.5 text-xs text-muted-foreground">Sin sugerencias: se usará el enlace tal como lo escribas.</p>
            </Autocomplete.Empty>
            <Autocomplete.List className="max-h-[min(18rem,var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0">
              {(o: UrlOption) => (
                <Autocomplete.Item
                  key={o.url}
                  value={o}
                  className="flex cursor-default flex-col rounded-md px-2 py-1.5 outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <span className="truncate text-sm">{o.label}</span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">{o.url}</span>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
