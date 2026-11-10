import type { Metadata } from "next";

// Página privada o de un solo uso: Google no la muestra en los resultados.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
