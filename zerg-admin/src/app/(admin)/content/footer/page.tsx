"use client";

import { Field, PageIntro, SaveBar, Section, SettingsState, TagsInput, TextField } from "@/components/cms/form";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const KEYS = ["contacto", "footer"] as const;

export default function FooterContentPage() {
  const { draft, status, error, savedAt, update, save, discard, isDirty } = useSiteSettings();
  if (!draft) return <SettingsState status={status === "error" ? "error" : "loading"} />;
  const { contacto, footer } = draft;

  return (
    <div className="space-y-6">
      <PageIntro title="Contacto y pie de página" description="Datos de contacto que ven tus clientes y el contenido del pie de todas las páginas." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Contacto">
          <TextField
            id="contacto-whatsapp"
            label="WhatsApp"
            placeholder="+51 999 999 999"
            value={contacto.whatsapp}
            onChange={(v) => update("contacto", { ...contacto, whatsapp: v })}
            hint="Con código de país. El botón “Escríbenos por WhatsApp” abre un chat con este número."
          />
          <TextField id="contacto-email" label="Correo de soporte" value={contacto.email} onChange={(v) => update("contacto", { ...contacto, email: v })} />
          <TextField id="contacto-horario" label="Horario de atención" value={contacto.horario} onChange={(v) => update("contacto", { ...contacto, horario: v })} />
        </Section>

        <Section title="Pie de página">
          <TextField id="footer-descripcion" label="Descripción de la tienda" multiline value={footer.descripcion} onChange={(v) => update("footer", { ...footer, descripcion: v })} />
          <Field label="Métodos de pago" hint="Se muestran como insignias en la franja inferior.">
            <TagsInput value={footer.metodosPago} onChange={(v) => update("footer", { ...footer, metodosPago: v })} placeholder="Ej. Yape" />
          </Field>
        </Section>
      </div>

      <SaveBar dirty={isDirty([...KEYS])} saving={status === "saving"} savedAt={savedAt} error={error} onSave={() => save([...KEYS])} onDiscard={discard} />
    </div>
  );
}
