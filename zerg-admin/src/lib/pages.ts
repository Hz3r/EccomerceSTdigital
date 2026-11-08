// Páginas de ayuda de la tienda (/ayuda/...) y guías del blog "¿Cómo comprar?".
export type PageBlock =
  | { tipo: "titulo"; texto: string }
  | { tipo: "texto"; texto: string }
  | { tipo: "video"; url: string; titulo: string }
  | { tipo: "imagen"; url: string; alt: string; pie: string }
  | { tipo: "pasos"; items: { titulo: string; texto: string }[] }
  | { tipo: "faq"; titulo: string; items: { pregunta: string; respuesta: string }[] }
  | { tipo: "aviso"; variante: "info" | "alerta" | "exito"; texto: string }
  | { tipo: "boton"; texto: string; url: string }

export interface HelpPage {
  id: string | null
  slug: string
  tipo: "PAGINA" | "GUIA"
  titulo: string
  resumen: string
  portadaUrl: string
  bloques: PageBlock[]
  publicado: boolean
  actualizado: string | null
  plantilla: boolean
}

export interface FixedPageSummary {
  slug: string
  titulo: string
  plantilla: boolean
  actualizado: string | null
}

export interface GuideSummary {
  id: string
  slug: string
  titulo: string
  resumen: string
  portadaUrl: string
  publicado: boolean
  video: boolean
  actualizado: string
}

// Enlace de cada página en la tienda
export const storePath = (page: { slug: string; tipo?: "PAGINA" | "GUIA" }) =>
  page.tipo === "GUIA" ? `/ayuda/como-comprar/${page.slug}` : `/ayuda/${page.slug}`

export function videoKind(url: string): "youtube" | "vimeo" | "tiktok" | "file" | "unknown" {
  if (url.startsWith("/api/uploads/") || /\.(mp4|webm|mov)(\?|$)/i.test(url)) return "file"
  try {
    const host = new URL(url).hostname.replace(/^www\.|^m\./, "")
    if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") return "youtube"
    if (host === "vimeo.com" || host === "player.vimeo.com") return "vimeo"
    if (host === "tiktok.com" && /\/video\/\d+/.test(url)) return "tiktok"
  } catch {
    // enlace no válido
  }
  return "unknown"
}
