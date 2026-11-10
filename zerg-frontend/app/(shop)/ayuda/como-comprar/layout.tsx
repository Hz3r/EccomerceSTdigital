import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "¿Cómo comprar? Guías y videos",
  description: "Compra en 4 pasos y recibe tus accesos en minutos. Guías y videos para pagar con Yape, Plin o tarjeta y ver tus accesos.",
  alternates: { canonical: "/ayuda/como-comprar" },
};

export default function HowToBuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
