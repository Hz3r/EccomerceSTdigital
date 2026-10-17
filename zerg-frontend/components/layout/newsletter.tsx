"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";

export function Newsletter() {
  const [sent, setSent] = useState(false);

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
            Suscríbete a nuestro boletín
          </h2>
          <p className="mt-3 max-w-sm text-sm text-brand-ink/75">
            Recibe primero las ofertas, combos y nuevos servicios. Un correo a la semana, sin spam.
          </p>

          {sent ? (
            <p className="mt-8 inline-flex items-center gap-2 rounded-xl bg-surface-ink px-4 py-3 text-sm font-medium text-white">
              <Check className="size-4 text-brand" />
              ¡Listo! Te avisaremos de las próximas ofertas.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
            >
              <input
                required
                placeholder="Nombre"
                aria-label="Nombre"
                className="h-11 rounded-xl border border-brand-ink/15 bg-white/90 px-4 text-sm text-brand-ink outline-none placeholder:text-brand-ink/50 focus:bg-white focus:ring-3 focus:ring-brand-ink/20 sm:w-40"
              />
              <input
                required
                type="email"
                placeholder="Correo electrónico"
                aria-label="Correo electrónico"
                className="h-11 flex-1 rounded-xl border border-brand-ink/15 bg-white/90 px-4 text-sm text-brand-ink outline-none placeholder:text-brand-ink/50 focus:bg-white focus:ring-3 focus:ring-brand-ink/20"
              />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surface-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-surface-ink-hover"
              >
                <Send className="size-4" />
                Suscribirme
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
