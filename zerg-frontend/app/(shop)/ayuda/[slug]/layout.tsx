import type { Metadata } from "next";
import { fetchApi, metaDescription } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchApi<{ titulo: string; resumen: string }>(`/pages/${encodeURIComponent(slug)}`);
  return {
    title: page?.titulo ?? "Ayuda",
    description: metaDescription(page?.resumen),
    alternates: { canonical: `/ayuda/${slug}` },
  };
}

export default function HelpPageLayout({ children }: Props) {
  return children;
}
