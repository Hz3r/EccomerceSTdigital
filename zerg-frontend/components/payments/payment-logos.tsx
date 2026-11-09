"use client";

import type { ComponentType, SVGProps } from "react";
import {
  Amex,
  Diners,
  Discover,
  Jcb,
  Maestro,
  Mastercard,
  Paypal,
  UnionPay,
  Visa,
} from "react-svg-credit-card-payment-icons/icons/flat-rounded";
import { useSite } from "@/hooks/useSiteSettings";
import { assetUrl, type LogoPago } from "@/lib/site-settings";
import { cn } from "@/lib/utils";
import type { MetodoPago } from "@/types";

const KEY: Record<MetodoPago, "directo" | "izipay" | "binance"> = { DIRECTO: "directo", IZIPAY: "izipay", BINANCE_PAY: "binance" };

// Logos oficiales de tarjetas (librería react-svg-credit-card-payment-icons, MIT) por nombre normalizado.
// Se usan cuando el logo no tiene imagen subida en el admin. Yape, Plin, QR, etc. no están en la librería.
const BRAND_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  visa: Visa,
  mastercard: Mastercard,
  amex: Amex,
  americanexpress: Amex,
  diners: Diners,
  dinersclub: Diners,
  discover: Discover,
  jcb: Jcb,
  unionpay: UnionPay,
  paypal: Paypal,
  maestro: Maestro,
};

const brandIcon = (nombre: string) =>
  BRAND_ICONS[nombre.normalize("NFD").replace(/[^a-zA-Z]/g, "").toLowerCase()];

/** Logos configurados en el admin (Contenido del sitio → Pagos) para un método de pago. */
export function useMethodLogos(metodo: MetodoPago): LogoPago[] {
  const logos = useSite().settings.pagos.logos;
  return (logos?.[KEY[metodo]] ?? []).filter((l) => l.nombre.trim() || l.logoUrl);
}

/**
 * Fila de logos pequeños (VISA, Mastercard, Yape…) en tarjetitas blancas, como las de las pasarelas de pago.
 * Prioridad: imagen subida en el admin → logo oficial de la librería (tarjetas) → el nombre en una tarjetita.
 */
export function PaymentLogos({ logos, className, muted }: { logos: LogoPago[]; className?: string; muted?: boolean }) {
  if (logos.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", muted && "opacity-50 grayscale", className)} aria-label="Medios aceptados">
      {logos.map((logo, i) => {
        const Brand = !logo.logoUrl ? brandIcon(logo.nombre) : undefined;
        return (
          <li
            key={`${logo.nombre}-${i}`}
            title={logo.nombre}
            className={cn(
              "flex h-7 items-center justify-center overflow-hidden rounded-md shadow-sm",
              Brand ? "" : "min-w-11 border border-black/10 bg-white",
              !logo.logoUrl && !Brand && "px-1.5"
            )}
          >
            {logo.logoUrl ? (
              // La imagen ocupa toda la tarjetita (alto completo; el ancho sigue la proporción del logo)
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(logo.logoUrl)} alt={logo.nombre} loading="lazy" className="h-full w-auto max-w-24 object-cover" />
            ) : Brand ? (
              <Brand role="img" aria-label={logo.nombre} className="h-full w-auto" />
            ) : (
              <span className="text-[10px] leading-none font-extrabold tracking-tight whitespace-nowrap text-neutral-800">{logo.nombre}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Logos de un método (atajo para usar dentro de las tarjetas de método). */
export function MethodLogos({ metodo, className, muted }: { metodo: MetodoPago; className?: string; muted?: boolean }) {
  return <PaymentLogos logos={useMethodLogos(metodo)} className={className} muted={muted} />;
}
