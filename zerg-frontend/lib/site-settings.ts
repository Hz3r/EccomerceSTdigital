import api from "./axios";
import { USE_MOCKS } from "./api";
import type { ApiResponse } from "@/types";

// Contenido editable desde el panel admin (Contenido del sitio).
// Mantener sincronizado con zerg-backend/src/modules/settings/settings.defaults.ts.
export interface MenuLink {
  etiqueta: string;
  url: string;
  imagenUrl: string;
}

export interface MenuGroup {
  titulo: string;
  enlaces: MenuLink[];
}

// Elemento de la barra de categorías. Con `categoria` enlaza a esa categoría; si no, a `url`.
export interface MenuItem {
  etiqueta: string;
  categoria: string;
  url: string;
  desplegable: boolean;
  grupos: MenuGroup[];
}

export interface Plataforma {
  nombre: string;
  logoUrl: string;
}

export interface SiteSettings {
  marca: { nombre: string; logoUrl: string; iconoUrl: string };
  header: { anuncio: string; buscadorPlaceholder: string; mostrarOfertas: boolean; menu: MenuItem[] };
  portada: {
    hero: {
      etiqueta: string;
      titulo: string;
      tituloDestacado: string;
      descripcion: string;
      ctaPrimarioTexto: string;
      ctaPrimarioUrl: string;
      ctaSecundarioTexto: string;
      ctaSecundarioUrl: string;
    };
    destacado: { productoSlug: string; etiqueta: string; descripcion: string };
    tendencias: string[];
    spotlight: string[];
    carruseles: string[];
    plataformas: Plataforma[];
    secciones: Record<
      | "beneficios"
      | "masBuscado"
      | "tendencias"
      | "carruseles"
      | "plataformas"
      | "categorias"
      | "opiniones"
      | "recienLlegados"
      | "creceConZerg"
      | "boletin",
      boolean
    >;
  };
  contacto: { whatsapp: string; email: string; horario: string };
  footer: { descripcion: string; metodosPago: string[] };
}

function menuItem(patch: Partial<MenuItem>): MenuItem {
  return { etiqueta: "", categoria: "", url: "", desplegable: false, grupos: [], ...patch };
}

export const defaultSettings: SiteSettings = {
  marca: {
    nombre: "ZERG",
    // Vacío = usar el logo incluido en la tienda (public/zerg-logo.png)
    logoUrl: "",
    iconoUrl: "",
  },
  header: {
    anuncio: "Entrega inmediata 24/7",
    buscadorPlaceholder: "Buscar Netflix, Spotify, Canva...",
    mostrarOfertas: true,
    menu: [
      ...["streaming", "musica", "ia", "diseno", "productividad"].map((categoria) => menuItem({ categoria })),
      menuItem({
        categoria: "gaming",
        desplegable: true,
        grupos: [
          {
            titulo: "Suscripciones",
            enlaces: [
              { etiqueta: "Xbox Game Pass", url: "/product/game-pass", imagenUrl: "" },
              { etiqueta: "PlayStation Plus", url: "/product/playstation-plus", imagenUrl: "" },
              { etiqueta: "Nintendo Switch Online", url: "/product/nintendo-switch-online", imagenUrl: "" },
              { etiqueta: "Discord Nitro", url: "/product/discord-nitro", imagenUrl: "" },
            ],
          },
          {
            titulo: "Tarjetas de regalo",
            enlaces: [{ etiqueta: "Steam Wallet", url: "/product/steam-wallet", imagenUrl: "" }],
          },
        ],
      }),
    ],
  },
  portada: {
    hero: {
      etiqueta: "Nuevos servicios cada semana",
      titulo: "Todo tu entretenimiento",
      tituloDestacado: "en un solo lugar",
      descripcion:
        "Streaming, música, inteligencia artificial y gaming al mejor precio. Compra en segundos y recibe tu acceso al instante.",
      ctaPrimarioTexto: "Ver catálogo",
      ctaPrimarioUrl: "/products",
      ctaSecundarioTexto: "Ver ofertas",
      ctaSecundarioUrl: "/products?ofertas=1",
    },
    destacado: {
      productoSlug: "netflix-premium",
      etiqueta: "Más vendido",
      descripcion: "Perfil privado en 4K, listo para usar en minutos.",
    },
    // Vacío = se eligen solos los productos con mejor descuento
    tendencias: [],
    spotlight: ["ia", "streaming", "diseno", "gaming"],
    carruseles: ["ia", "diseno", "streaming"],
    plataformas: [
      "Netflix", "Disney+", "Max", "Prime Video", "Spotify", "YouTube", "Crunchyroll",
      "ChatGPT", "Canva", "Microsoft 365", "Xbox", "PlayStation", "NordVPN",
    ].map((nombre) => ({ nombre, logoUrl: "" })),
    secciones: {
      beneficios: true,
      masBuscado: true,
      tendencias: true,
      carruseles: true,
      plataformas: true,
      categorias: true,
      opiniones: true,
      recienLlegados: true,
      creceConZerg: true,
      boletin: true,
    },
  },
  contacto: {
    whatsapp: "",
    email: "soporte@zerg.store",
    horario: "Lun a Dom · 8:00 a 23:00",
  },
  footer: {
    descripcion:
      "Tu tienda de servicios digitales: streaming, música, IA y más, con entrega inmediata y soporte real.",
    metodosPago: ["Yape", "Plin", "VISA", "Mastercard", "PayPal", "Binance"],
  },
};


// Tolera una API con el formato anterior (sin menú, plataformas como texto).
function normalize(s: SiteSettings): SiteSettings {
  const plataformas = (s.portada.plataformas as (Plataforma | string)[]).map((p) =>
    typeof p === "string" ? { nombre: p, logoUrl: "" } : p
  );
  return {
    ...s,
    header: { ...s.header, menu: Array.isArray(s.header.menu) ? s.header.menu : defaultSettings.header.menu },
    portada: { ...s.portada, plataformas },
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (USE_MOCKS) return defaultSettings;
  try {
    const res = await api.get<ApiResponse<SiteSettings>>("/settings");
    return normalize(res.data.data);
  } catch {
    return defaultSettings;
  }
}

// Solo rutas internas o http(s): evita enlaces `javascript:` cargados desde el admin.
export function safeHref(url?: string | null) {
  const u = (url ?? "").trim();
  if (!u) return "";
  return /^(\/|#|https?:\/\/|mailto:)/i.test(u) ? u : "";
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/api\/?$/, "");

// Las imágenes subidas desde el admin llegan como "/api/uploads/...": se completan con el origen de la API.
export function assetUrl(url?: string | null) {
  if (!url) return "";
  return url.startsWith("/api/") ? `${API_ORIGIN}${url}` : url;
}
