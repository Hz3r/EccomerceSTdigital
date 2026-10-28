"use client";

import { useEffect, useSyncExternalStore } from "react";

// Escucha los cambios de la tienda y de otras pestañas del admin (GET /api/events, SSE).
export type Topic = "settings" | "products" | "categories" | "plans" | "reviews" | "orders" | "users" | "notifications" | "support";
export type Action = "created" | "updated" | "deleted";
export interface LiveEvent {
  topic: Topic;
  action: Action;
  at: number;
}

const versions = new Map<Topic, number>();
const listeners = new Set<() => void>();
const eventListeners = new Set<(e: LiveEvent) => void>();
let source: EventSource | null = null;
let connected = false;

function connect() {
  if (source || typeof window === "undefined") return;
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  source = new EventSource(`${base}/events`);
  source.addEventListener("ready", () => {
    connected = true;
    listeners.forEach((l) => l());
  });
  source.addEventListener("error", () => {
    connected = false;
    listeners.forEach((l) => l());
  });
  source.addEventListener("change", (e) => {
    try {
      const event = JSON.parse((e as MessageEvent).data) as LiveEvent;
      versions.set(event.topic, (versions.get(event.topic) ?? 0) + 1);
      listeners.forEach((l) => l());
      eventListeners.forEach((l) => l(event));
    } catch {}
  });
}

function subscribe(listener: () => void) {
  connect();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Número que cambia con cada aviso de los temas indicados: úsalo como dependencia para volver a cargar. */
export function useLiveVersion(...topics: Topic[]) {
  return useSyncExternalStore(
    subscribe,
    () => topics.reduce((sum, t) => sum + (versions.get(t) ?? 0), 0),
    () => 0
  );
}

/** true mientras la conexión en tiempo real está activa. */
export function useLiveStatus() {
  return useSyncExternalStore(subscribe, () => connected, () => false);
}

/** Ejecuta `handler` con cada evento (para avisos tipo toast). */
export function useLiveEvents(handler: (e: LiveEvent) => void) {
  useEffect(() => {
    connect();
    eventListeners.add(handler);
    return () => {
      eventListeners.delete(handler);
    };
  }, [handler]);
}
