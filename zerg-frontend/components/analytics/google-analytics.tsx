"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useSite } from "@/hooks/useSiteSettings";
import { validGoogleId } from "@/lib/analytics";

/**
 * Carga Google Analytics 4 con el ID configurado en el admin y registra cada vista de página.
 * La tienda cambia de página sin recargar, así que las vistas se envían a mano al cambiar la ruta.
 */
export function GoogleAnalytics() {
  const googleId = validGoogleId(useSite().settings.analytics?.googleId);
  const pathname = usePathname();

  useEffect(() => {
    // Si gtag aún no cargó, la vista inicial la envía el script de abajo.
    if (!googleId || typeof window.gtag !== "function") return;
    const path = pathname + window.location.search;
    const w = window as Window & { __gaPath?: string };
    if (w.__gaPath === path) return; // ya contada (evita duplicar la primera vista)
    w.__gaPath = path;
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [googleId, pathname]);

  if (!googleId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};
gtag('js',new Date());
gtag('config','${googleId}',{send_page_view:false});
window.__gaPath=location.pathname+location.search;
gtag('event','page_view',{page_path:window.__gaPath,page_location:location.href,page_title:document.title});`}
      </Script>
    </>
  );
}
