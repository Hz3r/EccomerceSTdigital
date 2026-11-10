import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, absoluteAsset, activePlanPrices, fetchApi, metaDescription } from "@/lib/seo";
import type { Product } from "@/types";

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

const getProduct = (slug: string) => fetchApi<Product>(`/products/${encodeURIComponent(slug)}`, 600);

// Título, descripción e imagen de cada producto para Google y para compartir por WhatsApp/redes.
export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Producto", alternates: { canonical: `/product/${slug}` } };

  const prices = activePlanPrices(product);
  const desde = prices.length ? ` desde S/ ${Math.min(...prices).toFixed(2)}` : "";
  const description = metaDescription(product.descripcion, `${product.nombre}${desde}: entrega inmediata y garantía en ${SITE_NAME}.`);
  const image = absoluteAsset(product.imagenUrl || product.imagenTarjeta);
  return {
    title: `${product.nombre}${desde}`,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { type: "website", title: product.nombre, description, url: `/product/${product.slug}`, ...(image && { images: [{ url: image, alt: product.nombre }] }) },
    twitter: { card: "summary_large_image", title: product.nombre, description, ...(image && { images: [image] }) },
  };
}

// Datos estructurados de producto: Google puede mostrar el precio y la disponibilidad en los resultados.
export default async function ProductLayout({ params, children }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const prices = product ? activePlanPrices(product) : [];
  const soldOut = product?.disponible === false || product?.stock === 0;

  const jsonLd = product && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    description: metaDescription(product.descripcion, product.nombre),
    sku: product.slug,
    url: `${SITE_URL}/product/${product.slug}`,
    ...(absoluteAsset(product.imagenUrl) && { image: [absoluteAsset(product.imagenUrl), ...(product.galeria ?? []).map(absoluteAsset).filter(Boolean)] }),
    ...(product.category?.nombre && { category: product.category.nombre }),
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(prices.length > 0 && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "PEN",
        lowPrice: Math.min(...prices).toFixed(2),
        highPrice: Math.max(...prices).toFixed(2),
        offerCount: prices.length,
        availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        seller: { "@type": "Organization", name: SITE_NAME },
      },
    }),
  };

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      {children}
    </>
  );
}
