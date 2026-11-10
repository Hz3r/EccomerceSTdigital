import type { Metadata } from "next";
import { fetchApi, metaDescription } from "@/lib/seo";

type Props = { params: Promise<{ guia: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { guia } = await params;
  const page = await fetchApi<{ titulo: string; resumen: string; portadaUrl?: string }>(`/pages/${encodeURIComponent(guia)}`);
  return {
    title: page?.titulo ?? "Guía",
    description: metaDescription(page?.resumen),
    alternates: { canonical: `/ayuda/como-comprar/${guia}` },
    openGraph: { type: "article", title: page?.titulo },
  };
}

export default function GuideLayout({ children }: Props) {
  return children;
}
