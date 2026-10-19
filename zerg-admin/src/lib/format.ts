const PEN = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COMPACT = new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 });

export function formatPrice(value: number | string) {
  return `S/ ${PEN.format(Number(value))}`;
}

export function formatCompactPrice(value: number) {
  return `S/ ${COMPACT.format(value)}`;
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/api\/?$/, "");

// Las imágenes subidas llegan como "/api/uploads/...": se completan con el origen de la API.
export function assetUrl(url?: string | null) {
  if (!url) return "";
  return url.startsWith("/api/") ? `${API_ORIGIN}${url}` : url;
}

export const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
