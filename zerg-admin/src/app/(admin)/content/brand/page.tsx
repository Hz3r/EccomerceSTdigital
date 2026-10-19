"use client";

import Image from "next/image";
import { Search, ShoppingCart, Tag, Zap } from "lucide-react";
import { ImageField } from "@/components/image-field";
import { Field, OrderedPicker, PageIntro, SaveBar, Section, SettingsState, TextField, Toggle } from "@/components/cms/form";
import { useCatalogOptions } from "@/hooks/useCatalogOptions";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { assetUrl } from "@/lib/format";

const KEYS = ["marca", "header"] as const;

export default function BrandContentPage() {
  const { draft, status, error, savedAt, update, save, discard, isDirty } = useSiteSettings();
  const { categories } = useCatalogOptions();

  if (!draft) return <SettingsState status={status === "error" ? "error" : "loading"} />;
  const { marca, header } = draft;
  const menu = header.categoriasMenu.map((slug) => categories.find((c) => c.value === slug)?.label ?? slug);

  return (
    <div className="space-y-6">
      <PageIntro title="Marca y header" description="El logo, el nombre y la barra superior que se ven en todas las páginas de la tienda." />

      {/* Vista previa del header */}
      <div className="overflow-hidden rounded-2xl border bg-background">
        <p className="border-b bg-muted/50 px-4 py-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Vista previa</p>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-8 shrink-0">
            {marca.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(marca.logoUrl)} alt={marca.nombre} className="h-full w-auto" />
            ) : (
              <Image src="/zerg-logo.png" alt={marca.nombre} width={900} height={369} className="h-full w-auto" />
            )}
          </div>
          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-muted px-3 text-xs text-muted-foreground">
            <Search className="size-3.5" />
            <span className="truncate">{header.buscadorPlaceholder}</span>
          </div>
          <ShoppingCart className="size-4 shrink-0" />
        </div>
        <div className="flex items-center gap-3 overflow-hidden border-t px-5 py-2.5 text-xs">
          <span className="font-semibold">Todos los productos</span>
          {menu.slice(0, 6).map((m) => (
            <span key={m} className="whitespace-nowrap text-muted-foreground">
              {m}
            </span>
          ))}
          {header.mostrarOfertas && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-ink px-2 py-1 font-semibold whitespace-nowrap text-white">
              <Tag className="size-3 text-brand-yellow" /> Ofertas
            </span>
          )}
          {header.anuncio && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 font-semibold whitespace-nowrap text-brand-ink">
              <Zap className="size-3 fill-current" /> {header.anuncio}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Marca" description="Si no subes un logo se usa el logo ZERG incluido en la tienda.">
          <TextField id="marca-nombre" label="Nombre de la tienda" value={marca.nombre} onChange={(v) => update("marca", { ...marca, nombre: v })} hint="Se usa como texto alternativo del logo y en el pie de página." />
          <Field label="Logo horizontal" hint="PNG con fondo transparente, idealmente de 900 × 370 px.">
            <ImageField value={marca.logoUrl} onChange={(v) => update("marca", { ...marca, logoUrl: v })} folder="branding" previewClassName="h-20 w-40" />
          </Field>
          <Field label="Ícono (redondo)" hint="Se usa en la portada, el login y como ícono de la pestaña. Cuadrado, 512 × 512 px.">
            <ImageField value={marca.iconoUrl} onChange={(v) => update("marca", { ...marca, iconoUrl: v })} folder="branding" />
          </Field>
        </Section>

        <Section title="Barra superior">
          <TextField id="header-anuncio" label="Anuncio destacado" value={header.anuncio} onChange={(v) => update("header", { ...header, anuncio: v })} hint="La pastilla verde a la derecha del menú. Déjalo vacío para ocultarla." />
          <TextField id="header-buscador" label="Texto del buscador" value={header.buscadorPlaceholder} onChange={(v) => update("header", { ...header, buscadorPlaceholder: v })} />
          <Toggle label="Mostrar botón de Ofertas" checked={header.mostrarOfertas} onChange={(v) => update("header", { ...header, mostrarOfertas: v })} />
          <Field label="Categorías del menú" hint="En este orden aparecen en la barra de categorías (se recomiendan hasta 6).">
            <OrderedPicker options={categories} value={header.categoriasMenu} onChange={(v) => update("header", { ...header, categoriasMenu: v })} max={8} />
          </Field>
        </Section>
      </div>

      <SaveBar dirty={isDirty([...KEYS])} saving={status === "saving"} savedAt={savedAt} error={error} onSave={() => save([...KEYS])} onDiscard={discard} />
    </div>
  );
}
