"use client";

import Image from "next/image";
import Link from "next/link";
import { useSite } from "@/hooks/useSiteSettings";
import { assetUrl } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

// Logo configurable desde el admin (Marca y header). Sin logo propio se usa el de ZERG incluido.
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  const { marca } = useSite().settings;
  return (
    <Link href="/" aria-label={`${marca.nombre} — Inicio`} className={cn("inline-flex shrink-0 items-center", className)}>
      {marca.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assetUrl(marca.logoUrl)} alt={marca.nombre} className="h-full w-auto" />
      ) : (
        <Image src="/zerg-logo.png" alt={marca.nombre} width={900} height={369} priority={priority} className="h-full w-auto" />
      )}
    </Link>
  );
}

// Ícono redondo configurable (portada, login).
export function BrandIcon({ className, priority }: { className?: string; priority?: boolean }) {
  const { marca } = useSite().settings;
  return marca.iconoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={assetUrl(marca.iconoUrl)} alt="" className={className} />
  ) : (
    <Image src="/zerg-icon.png" alt="" width={512} height={512} priority={priority} className={className} />
  );
}
