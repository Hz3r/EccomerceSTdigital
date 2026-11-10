import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todos los productos: streaming, música, IA y más",
  description: "Netflix, Spotify, Disney+, Max, ChatGPT, Canva y más servicios digitales al mejor precio. Paga con Yape, Plin o tarjeta y recibe tu acceso al instante.",
  alternates: { canonical: "/products" },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
