import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El indicador de desarrollo de Next tapaba "Cerrar sesión" en el menú lateral
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
