"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";
const EVENT = "zerg-admin-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("admin-theme", theme);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

// Mientras cambia el tema se ignoran clics repetidos (evita el "doble cambio").
let switching = false;

/**
 * Cambia el tema con una transición suave: el tema nuevo se revela en un círculo que crece
 * desde el botón (View Transitions API). Sin soporte o con "reducir movimiento", cambia directo.
 */
export function setTheme(theme: Theme, origin?: { x: number; y: number }) {
  if (switching || getTheme() === theme) return;
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sin esto cada elemento con transition-colors cambiaría a su ritmo y se vería escalonado.
  root.classList.add("theme-switching");
  const done = () => {
    root.classList.remove("theme-switching");
    switching = false;
  };
  switching = true;

  if (!document.startViewTransition || reduceMotion) {
    applyTheme(theme);
    requestAnimationFrame(() => requestAnimationFrame(done));
    return;
  }

  const x = origin?.x ?? window.innerWidth - 40;
  const y = origin?.y ?? 40;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(() => applyTheme(theme));
  transition.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 450, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      )
    )
    .catch(() => {});
  transition.finished.finally(done);
}

export function ThemeToggle({ className }: { className?: string }) {
  // En el servidor se asume el tema por defecto (oscuro).
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      // Evita que un doble clic rápido seleccione texto de la página
      onMouseDown={(e) => e.detail > 1 && e.preventDefault()}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTheme(next, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
      aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors select-none hover:bg-muted",
        className
      )}
    >
      {/* El ícono gira y se desvanece en lugar de cambiar de golpe */}
      <span className="relative size-5">
        <Sun
          data-theme-icon
          className={cn(
            "absolute inset-0 size-5 transition-all duration-300",
            theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"
          )}
        />
        <Moon
          data-theme-icon
          className={cn(
            "absolute inset-0 size-5 transition-all duration-300",
            theme === "dark" ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          )}
        />
      </span>
    </button>
  );
}
