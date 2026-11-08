import type { SiteSettings } from "@/lib/site-settings";

// Páginas de ayuda (/ayuda/...) y guías del blog "¿Cómo comprar?", editables desde el admin.
export type HelpBlock =
  | { tipo: "titulo"; texto: string }
  | { tipo: "texto"; texto: string }
  | { tipo: "video"; url: string; titulo: string }
  | { tipo: "imagen"; url: string; alt: string; pie: string }
  | { tipo: "pasos"; items: { titulo: string; texto: string }[] }
  | { tipo: "faq"; titulo: string; items: { pregunta: string; respuesta: string }[] }
  | { tipo: "aviso"; variante: "info" | "alerta" | "exito"; texto: string }
  | { tipo: "boton"; texto: string; url: string };

export interface HelpPage {
  id: string | null;
  slug: string;
  tipo: "PAGINA" | "GUIA";
  titulo: string;
  resumen: string;
  portadaUrl: string;
  bloques: HelpBlock[];
  publicado: boolean;
  actualizado: string | null;
}

export interface GuideSummary {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  portadaUrl: string;
  video: boolean;
  actualizado: string;
}

export const HELP_LINKS = [
  { slug: "como-comprar", label: "¿Cómo comprar?" },
  { slug: "preguntas-frecuentes", label: "Preguntas frecuentes" },
  { slug: "garantia", label: "Garantía y reemplazos" },
  { slug: "terminos", label: "Términos y condiciones" },
  { slug: "privacidad", label: "Política de privacidad" },
] as const;

export const helpHref = (slug: string) => `/ayuda/${slug}`;
export const guideHref = (slug: string) => `/ayuda/como-comprar/${slug}`;

/** Reemplaza {tienda}, {whatsapp}, {email} y {horario} con los datos de Contenido del sitio. */
export function fillTokens(text: string, settings: SiteSettings) {
  const values: Record<string, string> = {
    tienda: settings.marca.nombre,
    whatsapp: settings.contacto.whatsapp || "nuestro WhatsApp",
    email: settings.contacto.email || "nuestro correo",
    horario: settings.contacto.horario || "nuestro horario de atención",
  };
  return text.replace(/\{(tienda|whatsapp|email|horario)\}/g, (_, key: string) => values[key]);
}

export type VideoSource =
  | { kind: "iframe"; src: string; vertical: boolean }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string };

/** YouTube (incluye Shorts), Vimeo y TikTok se incrustan; MP4/WebM o videos subidos usan el reproductor del navegador. */
export function videoSource(url: string): VideoSource {
  if (url.startsWith("/api/uploads/") || /\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: "file", src: url };
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return yt(u.pathname.slice(1), false);
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const shorts = u.pathname.match(/^\/shorts\/([\w-]+)/);
      if (shorts) return yt(shorts[1], true);
      const embed = u.pathname.match(/^\/(?:embed|live)\/([\w-]+)/);
      if (embed) return yt(embed[1], false);
      const v = u.searchParams.get("v");
      if (v) return yt(v, false);
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.match(/(\d{5,})/)?.[1];
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}`, vertical: false };
    }
    if (host === "tiktok.com") {
      const id = u.pathname.match(/\/video\/(\d+)/)?.[1];
      if (id) return { kind: "iframe", src: `https://www.tiktok.com/embed/v2/${id}`, vertical: true };
    }
  } catch {
    // enlace no válido: se muestra como enlace
  }
  return { kind: "link", src: url };
}

const yt = (id: string, vertical: boolean): VideoSource => ({
  kind: "iframe",
  src: `https://www.youtube-nocookie.com/embed/${id.replace(/[^\w-]/g, "")}?rel=0`,
  vertical,
});
