import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: "ZERG Admin",
    template: "%s · ZERG Admin",
  },
  description: "Panel de administración y CRM de la tienda ZERG",
  icons: { icon: "/zerg-icon.png" },
};

// Tema oscuro por defecto; el script lo quita antes de pintar si se eligió el claro.
// El menú compacto también se fija aquí: lo guardado o, sin preferencia, compacto en tablet.
const themeScript = `try{var d=document.documentElement;if(localStorage.getItem("admin-theme")==="light")d.classList.remove("dark");var s=localStorage.getItem("admin-sidebar");d.dataset.sidebar=s||(innerWidth<1280?"collapsed":"expanded")}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
