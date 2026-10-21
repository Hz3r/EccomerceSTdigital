"use client";

import { useSyncExternalStore } from "react";
import { USE_MOCKS } from "./api";

// Escucha en tiempo real los cambios que se hacen desde el admin (GET /api/events, SSE).
// Una sola conexión por pestaña; cada tema lleva un contador que sube con cada cambio.
export type Topic = "settings" | "products" | "categories" | "plans" | "reviews" | "orders" | "users" | "notifications";

const versions = new Map<Topic, number>();
const listeners = new Set<() => void>();
let source: EventSource | null = null;

function connect() {
  if (source || USE_MOCKS || typeof window === "undefined") return;
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  source = new EventSource(`${base}/events`);
  source.addEventListener("change", (e) => {
    try {
      const { topic } = JSON.parse((e as MessageEvent).data) as { topic: Topic };
      versions.set(topic, (versions.get(topic) ?? 0) + 1);
      listeners.forEach((l) => l());
    } catch {}
  });
  // EventSource reintenta solo si se corta la conexión (retry: 3000 desde el servidor).
}

function subscribe(listener: () => void) {
  connect();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Número que cambia cada vez que llega un aviso de alguno de los temas indicados. */
export function useLiveVersion(...topics: Topic[]) {
  return useSyncExternalStore(
    subscribe,
    () => topics.reduce((sum, t) => sum + (versions.get(t) ?? 0), 0),
    () => 0
  );
}
