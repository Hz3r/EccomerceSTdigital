import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Google puede leer el catálogo y la ayuda; las páginas privadas (cuenta, carrito, pago) no se indexan.
export default function robots(): MetadataRoute.Robots {
  const production = SITE_URL.startsWith("https://");
  return {
    rules: production
      ? { userAgent: "*", allow: "/", disallow: ["/account", "/cart", "/checkout", "/pago/", "/login", "/register", "/boletin/"] }
      : // Sin dominio configurado (desarrollo o pruebas) no se indexa nada
        { userAgent: "*", disallow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
