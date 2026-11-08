import type { Metadata } from "next";
import { HelpShell } from "@/components/help/help-shell";

export const metadata: Metadata = {
  title: "Centro de ayuda",
  description: "Cómo comprar, preguntas frecuentes, garantía, términos y privacidad.",
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <HelpShell>{children}</HelpShell>;
}
