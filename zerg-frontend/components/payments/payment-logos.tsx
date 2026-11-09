"use client";

import { useSite } from "@/hooks/useSiteSettings";
import { assetUrl, type LogoPago } from "@/lib/site-settings";
import { cn } from "@/lib/utils";
import type { MetodoPago } from "@/types";

const KEY: Record<MetodoPago, "directo" | "izipay" | "binance"> = { DIRECTO: "directo", IZIPAY: "izipay", BINANCE_PAY: "binance" };

/** Logos configurados en el admin (Contenido del sitio → Pagos) para un método de pago. */
export function useMethodLogos(metodo: MetodoPago): LogoPago[] {
  const logos = useSite().settings.pagos.logos;
  return (logos?.[KEY[metodo]] ?? []).filter((l) => l.nombre.trim() || l.logoUrl);
}

/**
 * Fila de logos pequeños (VISA, Mastercard, Yape…) en tarjetitas blancas, como las de las pasarelas de pago.
 * Con imagen se muestra el logo; sin imagen, el nombre en una tarjetita del mismo tamaño.
 */
export function PaymentLogos({ logos, className, muted }: { logos: LogoPago[]; className?: string; muted?: boolean }) {
  if (logos.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", muted && "opacity-50 grayscale", className)} aria-label="Medios aceptados">
      {logos.map((logo, i) => (
        <li
          key={`${logo.nombre}-${i}`}
          title={logo.nombre}
          className={cn(
            "flex h-7 items-center justify-center overflow-hidden rounded-md border border-black/10 bg-white shadow-sm",
            logo.logoUrl ? "min-w-11" : "min-w-11 px-1.5"
          )}
        >
          {logo.logoUrl ? (
            // La imagen ocupa toda la tarjetita (alto completo; el ancho sigue la proporción del logo)
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(logo.logoUrl)} alt={logo.nombre} loading="lazy" className="h-full w-auto max-w-24 object-cover" />
          ) : (
            <span className="text-[10px] leading-none font-extrabold tracking-tight whitespace-nowrap text-neutral-800">{logo.nombre}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Logos de un método (atajo para usar dentro de las tarjetas de método). */
export function MethodLogos({ metodo, className, muted }: { metodo: MetodoPago; className?: string; muted?: boolean }) {
  return <PaymentLogos logos={useMethodLogos(metodo)} className={className} muted={muted} />;
}
