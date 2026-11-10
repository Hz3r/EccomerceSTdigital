import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/api\/?$/, "");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Base para las URL absolutas (canónicas, Open Graph, sitemap): NEXT_PUBLIC_SITE_URL
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · Servicios digitales y streaming en Perú`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["Netflix", "Spotify", "Disney+", "Max", "Prime Video", "ChatGPT", "Canva", "streaming", "cuentas premium", "Perú", "Yape", "Plin"],
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · Servicios digitales y streaming`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/zerg-icon.png", alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image" },
  // Verificación de Google Search Console (método "Etiqueta HTML"): solo el valor de content="…"
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
  // Pestaña: app/favicon.ico (Next lo enlaza solo) y este PNG, ambos con el símbolo Z redondo.
  // apple-touch necesita fondo, por eso usa el cuadrado.
  icons: { icon: [{ url: "/zerg-favicon.png", type: "image/png" }], apple: "/zerg-icon.png" },
};

// Tema oscuro por defecto: el HTML llega con la clase "dark" y este script la quita
// antes de pintar si el visitante eligió el tema claro (evita el parpadeo).
const themeScript = `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

// Datos para Google: quiénes somos y el buscador del sitio (puede mostrar una caja de búsqueda en los resultados).
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/zerg-icon.png` },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "es-PE",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/products?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Abre la conexión con el backend mientras carga la página (catálogo e imágenes) */}
        <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
