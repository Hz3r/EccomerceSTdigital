import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  title: {
    default: "ZERG · Servicios digitales y streaming",
    template: "%s · ZERG",
  },
  description: "Streaming, música, IA y gaming al mejor precio, con entrega inmediata y garantía.",
  // Pestaña: app/favicon.ico (Next lo enlaza solo) y este PNG, ambos con el símbolo Z redondo.
  // apple-touch necesita fondo, por eso usa el cuadrado.
  icons: { icon: [{ url: "/zerg-favicon.png", type: "image/png" }], apple: "/zerg-icon.png" },
};

// Tema oscuro por defecto: el HTML llega con la clase "dark" y este script la quita
// antes de pintar si el visitante eligió el tema claro (evita el parpadeo).
const themeScript = `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

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
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
