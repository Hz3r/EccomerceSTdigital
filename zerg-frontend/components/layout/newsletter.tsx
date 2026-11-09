"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSite } from "@/hooks/useSiteSettings";
import api from "@/lib/axios";
import { USE_MOCKS } from "@/lib/api";
import { apiErrorMessage } from "@/lib/auth-redirect";
import { track } from "@/lib/analytics";

// Formulario del boletín: guarda el suscriptor en el backend (Suscriptores en el admin).
// Los textos se editan en el admin (Portada → Boletín) y la sección se oculta desde "Secciones visibles".
export function Newsletter() {
  const { user } = useAuth();
  const { boletin, secciones } = useSite().settings.portada;
  // null = aún no escrito: se propone el nombre y correo de la cuenta (si inició sesión)
  const [nombre, setNombre] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  if (!secciones.boletin) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const body = { nombre: nombre ?? user?.nombre ?? "", email: email ?? user?.email ?? "" };
      const message = USE_MOCKS
        ? boletin.mensajeExito
        : (await api.post<{ message?: string }>("/newsletter/subscribe", body)).data.message;
      setSent(boletin.mensajeExito || message || "¡Listo!");
      track("generate_lead", { lead_source: "boletin" });
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos suscribirte. Intenta de nuevo."));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="relative px-4 py-16 md:px-6 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-grid-soft [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-brand-gradient shadow-[0_30px_60px_-20px_rgb(5_196_138/0.55)]">
        {/* Cuadros decorativos inspirados en los rombos del logo */}
        <div className="absolute inset-y-0 right-0 w-1/2 bg-checker [mask-image:linear-gradient(to_left,black,transparent)]" />
        <span className="absolute top-8 right-10 size-8 rotate-45 rounded-md bg-brand-yellow shadow-lg" />
        <span className="absolute top-20 right-24 size-5 rotate-45 rounded bg-surface-ink/80" />
        <span className="absolute right-14 bottom-10 size-6 rotate-45 rounded-md bg-brand-yellow/90" />

        <div className="relative px-6 py-10 md:px-12 md:py-14">
          <h2 className="max-w-md text-2xl font-extrabold tracking-tight text-brand-ink md:text-4xl">
            {boletin.titulo}
          </h2>
          {boletin.descripcion && <p className="mt-3 max-w-sm text-sm text-brand-ink/75">{boletin.descripcion}</p>}

          {sent ? (
            <p className="mt-8 inline-flex items-center gap-2 rounded-xl bg-surface-ink px-4 py-3 text-sm font-medium text-white">
              <Check className="size-4 text-brand" />
              {sent}
            </p>
          ) : (
            <form onSubmit={submit} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
              <input
                required
                maxLength={80}
                autoComplete="name"
                value={nombre ?? user?.nombre ?? ""}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
                aria-label="Nombre"
                className="h-11 rounded-xl border border-brand-ink/15 bg-white/90 px-4 text-sm text-brand-ink outline-none placeholder:text-brand-ink/50 focus:bg-white focus:ring-3 focus:ring-brand-ink/20 sm:w-40"
              />
              <input
                required
                type="email"
                maxLength={160}
                autoComplete="email"
                value={email ?? user?.email ?? ""}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                aria-label="Correo electrónico"
                className="h-11 flex-1 rounded-xl border border-brand-ink/15 bg-white/90 px-4 text-sm text-brand-ink outline-none placeholder:text-brand-ink/50 focus:bg-white focus:ring-3 focus:ring-brand-ink/20"
              />
              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surface-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-surface-ink-hover disabled:opacity-70"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {boletin.boton || "Suscribirme"}
              </button>
            </form>
          )}
          {error && !sent && (
            <p role="alert" className="mt-3 max-w-xl rounded-lg bg-surface-ink/85 px-3 py-2 text-xs font-medium text-white">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
