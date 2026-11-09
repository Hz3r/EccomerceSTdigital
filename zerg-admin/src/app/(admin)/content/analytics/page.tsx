"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { PageIntro, SaveBar, Section, SettingsState, SetupBanner, TextField } from "@/components/cms/form";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const KEYS = ["analytics"] as const;

// Mismo criterio que la tienda (zerg-frontend/lib/analytics.ts): solo se carga un ID "G-XXXXXXX".
const isValidId = (id: string) => /^G-[A-Z0-9]{4,20}$/i.test(id.trim());

const EVENTS: { name: string; when: string }[] = [
  { name: "page_view", when: "Cada página que se visita" },
  { name: "view_item", when: "Alguien abre la ficha de un producto" },
  { name: "add_to_cart", when: "Agrega un producto al carrito" },
  { name: "begin_checkout", when: "Entra a la página de pago" },
  { name: "purchase", when: "Realiza un pedido (con su número y total)" },
  { name: "sign_up / login", when: "Crea una cuenta o inicia sesión (correo o Google)" },
  { name: "generate_lead", when: "Se suscribe al boletín" },
];

export default function AnalyticsPage() {
  const { draft, status, error, savedAt, setupMessage, loadError, update, save, discard, isDirty } = useSiteSettings();
  if (!draft) return <SettingsState status={status === "error" ? "error" : "loading"} reason={loadError} />;
  const googleId = draft.analytics?.googleId ?? "";
  const filled = googleId.trim() !== "";
  const valid = isValidId(googleId);

  return (
    <div className="space-y-6">
      <PageIntro
        title="Analítica"
        description="Conecta Google Analytics para ver cuántas personas visitan tu tienda, de dónde llegan y cuántas terminan comprando."
      />
      <SetupBanner message={setupMessage} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Google Analytics 4" description="Pega el ID de medición de tu propiedad de Google Analytics.">
          <TextField
            id="ga-id"
            label="ID de medición"
            placeholder="G-XXXXXXXXXX"
            value={googleId}
            onChange={(v) => update("analytics", { ...draft.analytics, googleId: v.trim().toUpperCase() })}
            hint="Vacío = la tienda no carga nada de Google. El panel de administración nunca se mide."
          />
          {filled && (
            <p className={`flex items-center gap-2 text-sm ${valid ? "text-primary" : "text-destructive"}`}>
              {valid ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}
              {valid
                ? "ID válido. Al guardar, la tienda empieza a enviar datos a Google Analytics."
                : "El ID debe tener el formato G-XXXXXXXXXX (empieza con G-). Revísalo en Google Analytics."}
            </p>
          )}
          <ol className="list-decimal space-y-1.5 rounded-xl bg-muted/50 p-4 pl-8 text-sm text-muted-foreground">
            <li>
              Entra a <span className="font-medium text-foreground">analytics.google.com</span> con tu cuenta de Google.
            </li>
            <li>
              <span className="font-medium text-foreground">Administrar</span> (engranaje) → <span className="font-medium text-foreground">Crear → Propiedad</span>:
              nombre de la tienda, zona horaria de Perú y moneda Sol peruano (PEN).
            </li>
            <li>
              Crea un <span className="font-medium text-foreground">flujo de datos Web</span> con la dirección de tu tienda.
            </li>
            <li>
              Copia el <span className="font-medium text-foreground">ID de medición</span> (G-…) y pégalo aquí. Guarda.
            </li>
            <li>
              Abre tu tienda y revisa en Google Analytics → <span className="font-medium text-foreground">Informes → Tiempo real</span> que aparezca tu visita.
            </li>
          </ol>
        </Section>

        <Section title="Qué se mide" description="Eventos estándar de comercio electrónico de Google Analytics 4, en soles (PEN).">
          <ul className="divide-y rounded-xl border text-sm">
            {EVENTS.map((e) => (
              <li key={e.name} className="flex items-center justify-between gap-3 px-3 py-2">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{e.name}</code>
                <span className="text-right text-muted-foreground">{e.when}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Con estos eventos, Google Analytics arma el embudo de compra en <span className="font-medium">Informes → Monetización</span>. “Pedido realizado” cuenta el
            pedido al crearse; el pago se confirma después en Órdenes.
          </p>
        </Section>
      </div>

      <SaveBar
        dirty={isDirty([...KEYS])}
        saving={status === "saving"}
        savedAt={savedAt}
        error={filled && !valid ? "Corrige el ID de medición antes de guardar." : error}
        onSave={() => (filled && !valid ? undefined : save([...KEYS]))}
        onDiscard={discard}
      />
    </div>
  );
}
