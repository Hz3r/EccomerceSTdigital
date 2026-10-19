"use client";

import { SetupBanner, Field, OrderedPicker, PageIntro, SaveBar, Section, SettingsState, TagsInput, TextField, Toggle } from "@/components/cms/form";
import { useCatalogOptions } from "@/hooks/useCatalogOptions";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { SiteSettings } from "@/types";

type Secciones = SiteSettings["portada"]["secciones"];

const SECTION_LABELS: { key: keyof Secciones; label: string; hint: string }[] = [
  { key: "beneficios", label: "Beneficios", hint: "Franja de entrega inmediata, garantía, precios y soporte" },
  { key: "masBuscado", label: "Lo más buscado", hint: "Tarjetas de colores por categoría" },
  { key: "tendencias", label: "Tendencias de la semana", hint: "Grilla con el producto destacado" },
  { key: "carruseles", label: "Carruseles por categoría", hint: "Filas deslizables de productos" },
  { key: "plataformas", label: "Plataformas", hint: "Marquesina con nombres de servicios" },
  { key: "categorias", label: "Explora por categoría", hint: "Tarjetas con accesos a cada categoría" },
  { key: "opiniones", label: "Opiniones de clientes", hint: "Reseñas aprobadas" },
  { key: "recienLlegados", label: "Recién llegados", hint: "Listas de los últimos servicios" },
  { key: "creceConZerg", label: "Crece con ZERG", hint: "Referidos, distribuidores y ZERG Shield" },
  { key: "boletin", label: "Boletín", hint: "Formulario de suscripción" },
];

export default function HomeContentPage() {
  const { draft, status, error, savedAt, setupMessage, loadError, update, save, discard, isDirty } = useSiteSettings();
  const { categories, products } = useCatalogOptions();

  if (!draft) return <SettingsState status={status === "error" ? "error" : "loading"} reason={loadError} />;
  const portada = draft.portada;
  const set = <K extends keyof typeof portada>(key: K, value: (typeof portada)[K]) => update("portada", { ...portada, [key]: value });
  const hero = portada.hero;
  const setHero = (patch: Partial<typeof hero>) => set("hero", { ...hero, ...patch });
  const destacado = portada.destacado;

  return (
    <div className="space-y-6">
      <PageIntro title="Portada" description="Edita lo que ven tus clientes al entrar a la tienda: el banner principal, los productos en tendencia y qué secciones se muestran." />
      <SetupBanner message={setupMessage} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Banner principal" description="El bloque oscuro grande de la parte superior.">
          <TextField id="hero-etiqueta" label="Etiqueta superior" value={hero.etiqueta} onChange={(v) => setHero({ etiqueta: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="hero-titulo" label="Título" value={hero.titulo} onChange={(v) => setHero({ titulo: v })} />
            <TextField id="hero-destacado" label="Título resaltado (verde)" value={hero.tituloDestacado} onChange={(v) => setHero({ tituloDestacado: v })} />
          </div>
          <TextField id="hero-descripcion" label="Descripción" multiline value={hero.descripcion} onChange={(v) => setHero({ descripcion: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="hero-cta1" label="Botón principal" value={hero.ctaPrimarioTexto} onChange={(v) => setHero({ ctaPrimarioTexto: v })} />
            <TextField id="hero-cta1-url" label="Enlace del botón principal" value={hero.ctaPrimarioUrl} onChange={(v) => setHero({ ctaPrimarioUrl: v })} />
            <TextField id="hero-cta2" label="Botón secundario" value={hero.ctaSecundarioTexto} onChange={(v) => setHero({ ctaSecundarioTexto: v })} hint="Vacío para ocultarlo." />
            <TextField id="hero-cta2-url" label="Enlace del botón secundario" value={hero.ctaSecundarioUrl} onChange={(v) => setHero({ ctaSecundarioUrl: v })} />
          </div>
        </Section>

        <Section title="Producto destacado" description="La tarjeta verde a la derecha del banner.">
          <Field label="Producto" htmlFor="destacado-producto">
            <select
              id="destacado-producto"
              value={destacado.productoSlug}
              onChange={(e) => set("destacado", { ...destacado, productoSlug: e.target.value })}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
            >
              {!products.some((p) => p.value === destacado.productoSlug) && (
                <option value={destacado.productoSlug}>{destacado.productoSlug || "Elegir producto"}</option>
              )}
              {products.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <TextField id="destacado-etiqueta" label="Etiqueta" value={destacado.etiqueta} onChange={(v) => set("destacado", { ...destacado, etiqueta: v })} />
          <TextField id="destacado-descripcion" label="Descripción corta" multiline value={destacado.descripcion} onChange={(v) => set("destacado", { ...destacado, descripcion: v })} />
        </Section>
      </div>

      <Section
        title="Tendencias de la semana"
        description="El primero se muestra grande. Si no eliges ninguno, la tienda muestra automáticamente los de mejor descuento."
      >
        <OrderedPicker options={products} value={portada.tendencias} onChange={(v) => set("tendencias", v)} max={9} emptyLabel="Automático: los productos con mejor descuento." />
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Lo más buscado" description="Hasta 4 categorías, cada una con su color.">
          <OrderedPicker options={categories} value={portada.spotlight} onChange={(v) => set("spotlight", v)} max={4} />
        </Section>
        <Section title="Carruseles por categoría" description="Una fila deslizable por cada categoría, en este orden.">
          <OrderedPicker options={categories} value={portada.carruseles} onChange={(v) => set("carruseles", v)} max={5} />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Plataformas" description="Nombres que se desplazan en la marquesina.">
          <TagsInput value={portada.plataformas} onChange={(v) => set("plataformas", v)} placeholder="Ej. Netflix" />
        </Section>
        <Section title="Secciones visibles" description="Oculta las secciones que no quieras mostrar por ahora.">
          <div className="grid gap-2 sm:grid-cols-2">
            {SECTION_LABELS.map((s) => (
              <Toggle
                key={s.key}
                label={s.label}
                hint={s.hint}
                checked={portada.secciones[s.key]}
                onChange={(v) => set("secciones", { ...portada.secciones, [s.key]: v })}
              />
            ))}
          </div>
        </Section>
      </div>

      <SaveBar dirty={isDirty(["portada"])} saving={status === "saving"} savedAt={savedAt} error={error} onSave={() => save(["portada"])} onDiscard={discard} />
    </div>
  );
}
