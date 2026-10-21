import { EventEmitter } from "events";
import type { NextFunction, Request, Response } from "express";

// Temas que la tienda y el admin escuchan para actualizarse sin recargar.
export type Topic = "settings" | "products" | "categories" | "plans" | "reviews" | "orders" | "users" | "notifications";

const bus = new EventEmitter();
bus.setMaxListeners(0);

export type Action = "created" | "updated" | "deleted";

export function emit(topic: Topic, action: Action = "updated") {
  bus.emit("change", { topic, action, at: Date.now() });
}

const ACTIONS: Record<string, Action> = { POST: "created", PUT: "updated", PATCH: "updated", DELETE: "deleted" };

// Ruta base de la API -> tema. Un cambio de planes también cambia lo que muestra un producto.
const ROUTE_TOPICS: Record<string, Topic[]> = {
  "/api/settings": ["settings"],
  "/api/products": ["products"],
  "/api/categories": ["categories"],
  "/api/plans": ["plans", "products"],
  "/api/reviews": ["reviews"],
  "/api/orders": ["orders"],
  "/api/users": ["users"],
  "/api/notifications": ["notifications"],
};

const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Emite el tema cuando una petición que modifica datos termina bien.
export function emitOnMutation(req: Request, res: Response, next: NextFunction) {
  if (MUTATIONS.has(req.method)) {
    const base = Object.keys(ROUTE_TOPICS).find((p) => req.originalUrl === p || req.originalUrl.startsWith(`${p}/`) || req.originalUrl.startsWith(`${p}?`));
    if (base) {
      res.on("finish", () => {
        if (res.statusCode < 400) ROUTE_TOPICS[base]?.forEach((topic) => emit(topic, ACTIONS[req.method]));
      });
    }
  }
  next();
}

// GET /api/events: flujo Server-Sent Events. Solo envía el nombre del tema, nunca datos,
// así que es seguro dejarlo público; cada cliente vuelve a pedir lo que necesite.
export function eventsHandler(req: Request, res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 3000\n\n");
  res.write(`event: ready\ndata: {}\n\n`);

  const onChange = (payload: { topic: Topic; action: Action; at: number }) => {
    res.write(`event: change\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

  bus.on("change", onChange);
  req.on("close", () => {
    clearInterval(heartbeat);
    bus.off("change", onChange);
  });
}

export function listenerCount() {
  return bus.listenerCount("change");
}
