import type { NextConfig } from "next";
import path from "path";

// Las imágenes subidas desde el admin viven en el backend (/api/uploads/...). Next las reduce al
// tamaño en que se muestran y las entrega en WebP (mucho más livianas que el PNG/JPG original).
const apiOrigin = new URL((process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/api\/?$/, ""));
const localApi = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(apiOrigin.hostname);

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: "/api/uploads/**",
      },
    ],
    // Solo en desarrollo, cuando el backend corre en esta misma máquina
    dangerouslyAllowLocalIP: localApi,
    qualities: [75, 85],
    // Los archivos subidos nunca cambian (nombre único): la versión optimizada se guarda 30 días
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // "Continuar con Google" abre una ventana emergente que devuelve el resultado con postMessage:
  // Google recomienda esta política para que el navegador no bloquee esa comunicación.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }] }];
  },
};

export default nextConfig;
