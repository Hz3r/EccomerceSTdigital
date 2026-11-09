// La pestaña que está en la página de pago avisa cada pocos segundos que sigue abierta. Así, si el
// cliente abre la tienda en otra pestaña, no le devolvemos al carrito el pedido que está pagando.
const KEY = "zerg:paying";
const FRESH_MS = 15_000;

export function markPaying(numeroOrden: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ numeroOrden, at: Date.now() }));
  } catch {}
}

export function clearPaying(numeroOrden: string) {
  try {
    const current = JSON.parse(localStorage.getItem(KEY) ?? "null") as { numeroOrden?: string } | null;
    if (current?.numeroOrden === numeroOrden) localStorage.removeItem(KEY);
  } catch {}
}

export function isBeingPaid(numeroOrden: string) {
  try {
    const current = JSON.parse(localStorage.getItem(KEY) ?? "null") as { numeroOrden?: string; at?: number } | null;
    return current?.numeroOrden === numeroOrden && Date.now() - (current.at ?? 0) < FRESH_MS;
  } catch {
    return false;
  }
}
