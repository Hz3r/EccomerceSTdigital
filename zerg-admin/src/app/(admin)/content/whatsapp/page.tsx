"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, CircleDashed, Copy, Loader2, PlugZap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-imput";
import { Field, PageIntro, SaveBar, Section, SettingsState, Toggle } from "@/components/cms/form";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

type TextKey = "phoneNumberId" | "version" | "countryCode" | "language" | "templateReply" | "templateCredentials" | "verifyToken";
type SecretKey = "token" | "appSecret";

interface WhatsappConfig extends Record<TextKey, string> {
  activo: boolean;
  conectado: boolean;
  token: string | null;
  appSecret: string | null;
  desdeEnv: Record<TextKey | SecretKey, boolean>;
  efectivo: { phoneNumberId: string; version: string; countryCode: string; language: string };
  webhook: string | null;
}

interface Draft extends Record<TextKey, string> {
  activo: boolean;
}

// Un secreto: "" = no tocar, null = borrar lo guardado en el panel, texto = reemplazar.
type SecretDraft = Record<SecretKey, string | null>;

interface TestResult {
  numero: string;
  nombre: string | null;
  calidad: string | null;
}

const TEXT_KEYS: TextKey[] = ["phoneNumberId", "version", "countryCode", "language", "templateReply", "templateCredentials", "verifyToken"];
const EMPTY_SECRETS: SecretDraft = { token: "", appSecret: "" };

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback;

const toDraft = (c: WhatsappConfig): Draft => ({ activo: c.activo, ...Object.fromEntries(TEXT_KEYS.map((k) => [k, c[k]])) }) as Draft;

const randomToken = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `zerg-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9"
      aria-label={`Copiar ${label}`}
      disabled={!value}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}

const EnvHint = ({ show }: { show: boolean }) =>
  show ? <span className="font-medium text-foreground">Ahora se usa el valor del .env del servidor.</span> : null;

function SecretField({ id, label, hint, saved, fromEnv, value, onChange }: {
  id: string;
  label: string;
  hint: React.ReactNode;
  saved: string | null;
  fromEnv: boolean;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const removing = value === null;
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={
        removing
          ? "Se quitará al guardar."
          : saved
            ? fromEnv
              ? `Se usa el del .env (${saved}). Escribe uno nuevo para guardarlo en el panel.`
              : `Guardado (${saved}). Déjalo vacío para conservarlo.`
            : hint
      }
    >
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <PasswordInput
            id={id}
            autoComplete="off"
            value={value ?? ""}
            disabled={removing}
            placeholder={saved && !removing ? saved : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        {saved && !fromEnv && (
          <Button type="button" variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={() => onChange(removing ? "" : null)}>
            {removing ? "Conservar" : "Quitar"}
          </Button>
        )}
      </div>
    </Field>
  );
}

export default function WhatsappSettingsPage() {
  const [config, setConfig] = React.useState<WhatsappConfig | null>(null);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [secrets, setSecrets] = React.useState<SecretDraft>(EMPTY_SECRETS);
  const [loadError, setLoadError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [test, setTest] = React.useState<{ ok: true; data: TestResult } | { ok: false; message: string } | null>(null);

  const apply = React.useCallback((c: WhatsappConfig) => {
    setConfig(c);
    setDraft(toDraft(c));
    setSecrets(EMPTY_SECRETS);
  }, []);

  const dirty = Boolean(
    config && draft && (draft.activo !== config.activo || TEXT_KEYS.some((k) => draft[k] !== config[k]) || secrets.token !== "" || secrets.appSecret !== "")
  );

  React.useEffect(() => {
    api
      .get<{ data: WhatsappConfig }>("/whatsapp/config")
      .then((res) => apply(res.data.data))
      .catch((err) => setLoadError(errorMessage(err, "Revisa que el backend esté encendido.")));
  }, [apply]);

  if (!config || !draft) return <SettingsState status={loadError ? "error" : "loading"} reason={loadError} />;

  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const env = config.desdeEnv;
  const placeholder = (k: keyof WhatsappConfig["efectivo"], fallback: string) => (env[k] ? config.efectivo[k] : fallback);

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const body: Record<string, unknown> = { activo: draft.activo };
      for (const k of TEXT_KEYS) if (draft[k] !== config[k]) body[k] = draft[k];
      for (const k of ["token", "appSecret"] as const) if (secrets[k] !== "") body[k] = secrets[k];
      const res = await api.put<{ data: WhatsappConfig }>("/whatsapp/config", body);
      apply(res.data.data);
      setSavedAt(new Date());
      setTest(null);
    } catch (err) {
      setSaveError(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    try {
      const res = await api.post<{ data: TestResult }>("/whatsapp/config/test");
      setTest({ ok: true, data: res.data.data });
    } catch (err) {
      setTest({ ok: false, message: errorMessage(err, "No se pudo probar la conexión") });
    } finally {
      setTesting(false);
    }
  };

  const missing = [
    !draft.phoneNumberId && !env.phoneNumberId && "Phone Number ID",
    !config.token && !secrets.token && "token de acceso",
    !config.appSecret && !secrets.appSecret && "App Secret",
    !draft.verifyToken && !env.verifyToken && "verify token",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <PageIntro
        title="WhatsApp"
        description="Conecta tu número de WhatsApp Business: los mensajes de tus clientes llegan a Mensajes, les respondes desde el panel y puedes enviarles sus accesos."
        storePath="/"
      />

      {/* Estado */}
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center",
          config.conectado ? "border-brand/40 bg-brand/8" : "bg-card"
        )}
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            config.conectado ? "bg-brand text-brand-ink" : "bg-muted text-muted-foreground"
          )}
        >
          {config.conectado ? <CheckCircle2 className="size-5" /> : <CircleDashed className="size-5" />}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">
            {config.conectado ? "WhatsApp Business conectado" : config.activo ? "WhatsApp Business sin conectar" : "WhatsApp Business desactivado"}
          </p>
          <p className="text-muted-foreground">
            {config.conectado
              ? `Phone Number ID …${config.efectivo.phoneNumberId.slice(-4)}. Usa “Probar conexión” para confirmar que Meta acepta tus datos.`
              : config.activo
                ? missing.length
                  ? `Falta: ${missing.join(", ")}.`
                  : "Guarda los cambios para conectarlo."
                : "Los mensajes de WhatsApp no se reciben ni se envían desde el panel."}
          </p>
          {test && (
            <p role="status" className={cn("mt-1.5 font-medium", test.ok ? "text-brand-strong dark:text-brand-bright" : "text-destructive")}>
              {test.ok
                ? `✓ Meta respondió: ${test.data.numero}${test.data.nombre ? ` · ${test.data.nombre}` : ""}${test.data.calidad ? ` · calidad ${test.data.calidad}` : ""}`
                : test.message}
            </p>
          )}
        </div>
        <Button type="button" variant="outline" disabled={testing || dirty || !config.conectado} onClick={runTest} title={dirty ? "Guarda los cambios antes de probar" : undefined}>
          {testing ? <Loader2 className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
          Probar conexión
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Section title="Conexión con Meta" description="Los datos de tu app en developers.facebook.com → WhatsApp → Configuración de la API.">
            <Toggle
              label="Usar WhatsApp Business"
              hint="Si lo desactivas, el panel deja de recibir y enviar mensajes de WhatsApp (los datos se conservan)."
              checked={draft.activo}
              onChange={(activo) => set({ activo })}
            />
            <Field
              label="Phone Number ID"
              htmlFor="wa-phone-id"
              hint={<>El identificador del número (no es el número de teléfono). <EnvHint show={env.phoneNumberId && !draft.phoneNumberId} /></>}
            >
              <Input
                id="wa-phone-id"
                inputMode="numeric"
                value={draft.phoneNumberId}
                placeholder={placeholder("phoneNumberId", "Ej. 109876543210")}
                onChange={(e) => set({ phoneNumberId: e.target.value.replace(/\s/g, "") })}
                className="font-mono"
              />
            </Field>
            <SecretField
              id="wa-token"
              label="Token de acceso"
              hint="Token permanente de un usuario del sistema (Business Manager → Usuarios del sistema). Se guarda cifrado."
              saved={config.token}
              fromEnv={env.token}
              value={secrets.token}
              onChange={(token) => setSecrets({ ...secrets, token })}
            />
            <SecretField
              id="wa-app-secret"
              label="App Secret"
              hint="En Configuración de la app → Básica. Sirve para comprobar que los mensajes vienen de Meta. Se guarda cifrado."
              saved={config.appSecret}
              fromEnv={env.appSecret}
              value={secrets.appSecret}
              onChange={(appSecret) => setSecrets({ ...secrets, appSecret })}
            />
          </Section>

          <Section title="Webhook" description="Así Meta le avisa al panel cuando un cliente te escribe.">
            <Field label="URL de devolución de llamada (Callback URL)">
              {config.webhook ? (
                <div className="flex gap-2">
                  <Input readOnly value={config.webhook} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
                  <CopyButton value={config.webhook} label="URL del webhook" />
                </div>
              ) : (
                <p className="flex gap-2 rounded-xl border border-viz-warning/40 bg-viz-warning/10 p-3 text-xs">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Define <code className="font-mono">BACKEND_PUBLIC_URL</code> en el .env del backend con su dirección pública (https://…). La URL será
                    esa dirección + <code className="font-mono">/api/whatsapp/webhook</code>.
                  </span>
                </p>
              )}
            </Field>
            <Field
              label="Verify token"
              htmlFor="wa-verify"
              hint={<>Una clave que inventas tú; pega la misma en Meta al registrar el webhook. <EnvHint show={env.verifyToken && !draft.verifyToken} /></>}
            >
              <div className="flex gap-2">
                <Input
                  id="wa-verify"
                  value={draft.verifyToken}
                  autoComplete="off"
                  placeholder={env.verifyToken ? "Definido en el .env" : "Ej. zerg-mi-clave"}
                  onChange={(e) => set({ verifyToken: e.target.value.trim() })}
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => set({ verifyToken: randomToken() })}>
                  <RefreshCw className="size-3.5" />
                  Generar
                </Button>
                <CopyButton value={draft.verifyToken} label="verify token" />
              </div>
            </Field>
          </Section>

          <Section
            title="Plantillas"
            description="WhatsApp solo deja escribir libremente hasta 24 h después del último mensaje del cliente. Pasado ese tiempo se usan plantillas aprobadas en Meta."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plantilla para responder" htmlFor="wa-tpl-reply" hint="Con una variable {{1}} donde va tu respuesta. Opcional.">
                <Input id="wa-tpl-reply" value={draft.templateReply} placeholder="Ej. respuesta_soporte" onChange={(e) => set({ templateReply: e.target.value.trim() })} className="font-mono" />
              </Field>
              <Field label="Plantilla para enviar accesos" htmlFor="wa-tpl-cred" hint="Variables {{1}} nombre, {{2}} n.º de pedido y {{3}} accesos. Opcional.">
                <Input id="wa-tpl-cred" value={draft.templateCredentials} placeholder="Ej. entrega_accesos" onChange={(e) => set({ templateCredentials: e.target.value.trim() })} className="font-mono" />
              </Field>
            </div>
            <details className="rounded-xl border p-3 text-sm">
              <summary className="cursor-pointer font-medium">Opciones avanzadas</summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Idioma de las plantillas" htmlFor="wa-lang" hint="Código de Meta, ej. es o es_PE.">
                  <Input id="wa-lang" value={draft.language} placeholder={placeholder("language", "es")} onChange={(e) => set({ language: e.target.value.trim() })} />
                </Field>
                <Field label="Código de país" htmlFor="wa-country" hint="Se agrega a celulares de 9 dígitos.">
                  <Input id="wa-country" inputMode="numeric" value={draft.countryCode} placeholder={placeholder("countryCode", "51")} onChange={(e) => set({ countryCode: e.target.value.trim() })} />
                </Field>
                <Field label="Versión de la API" htmlFor="wa-version" hint="Déjalo vacío salvo que Meta lo pida.">
                  <Input id="wa-version" value={draft.version} placeholder={placeholder("version", "v21.0")} onChange={(e) => set({ version: e.target.value.trim() })} />
                </Field>
              </div>
            </details>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Cómo conectarlo">
            <ol className="list-decimal space-y-2 pl-5 text-xs text-muted-foreground">
              <li>
                En <b className="text-foreground">developers.facebook.com</b> crea una app de tipo Empresa y agrégale el producto WhatsApp.
              </li>
              <li>
                En WhatsApp → Configuración de la API agrega tu número y copia su <b className="text-foreground">Phone Number ID</b>.
              </li>
              <li>
                En Business Manager crea un usuario del sistema con acceso a la app y genera un <b className="text-foreground">token permanente</b> con los permisos
                whatsapp_business_messaging y whatsapp_business_management.
              </li>
              <li>
                Copia el <b className="text-foreground">App Secret</b> desde Configuración de la app → Básica.
              </li>
              <li>Pega esos datos aquí, genera un verify token y guarda.</li>
              <li>
                En WhatsApp → Configuración registra la <b className="text-foreground">Callback URL</b> y el verify token de la sección Webhook, y suscríbete al
                campo <b className="text-foreground">messages</b>.
              </li>
              <li>Pulsa “Probar conexión” y escribe a tu número desde otro celular: el mensaje aparece en Mensajes.</li>
            </ol>
          </Section>
          <Section title="Botón de WhatsApp de la tienda">
            <p className="text-sm text-muted-foreground">
              El número al que escriben los clientes desde el chat de la tienda y el pie de página se cambia en{" "}
              <Link href="/content/footer" className="font-medium text-foreground underline">
                Contacto y pie
              </Link>
              . No necesita WhatsApp Business.
            </p>
          </Section>
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        savedAt={savedAt}
        error={saveError}
        onSave={save}
        onDiscard={() => {
          apply(config);
          setSaveError("");
        }}
      />
    </div>
  );
}
