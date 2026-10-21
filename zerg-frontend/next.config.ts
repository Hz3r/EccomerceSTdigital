import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // "Continuar con Google" abre una ventana emergente que devuelve el resultado con postMessage:
  // Google recomienda esta política para que el navegador no bloquee esa comunicación.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }] }];
  },
};

export default nextConfig;
