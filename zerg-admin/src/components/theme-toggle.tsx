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

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("admin-theme", theme);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function ThemeToggle({ className }: { className?: string }) {
  // En el servidor se asume el tema por defecto (oscuro).
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted",
        className
      )}
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
