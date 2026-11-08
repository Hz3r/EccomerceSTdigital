"use client";

import { useParams } from "next/navigation";
import { HelpLoading, HelpNotFound, HelpPageView } from "@/components/help/help-page-view";
import { useHelpPage } from "@/hooks/useHelpPage";

// Preguntas frecuentes, Garantía, Términos y Privacidad (y cualquier página fija), editables desde el admin.
export default function HelpPageRoute() {
  const { slug } = useParams<{ slug: string }>();
  const { data, error } = useHelpPage(slug);
  if (error) return <HelpNotFound error={error} />;
  if (!data) return <HelpLoading />;
  return <HelpPageView page={data} />;
}
