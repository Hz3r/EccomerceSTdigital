import Link from "next/link";
import { BrandIcon } from "@/components/brand/logo";
import { ArrowRight, Headphones, Percent, RefreshCw, ShieldCheck, Store, Users } from "lucide-react";

export function GrowWithZerg() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <GrowCard
          icon={Users}
          eyebrow="Programa de referidos"
          title="Gana 10% por cada amigo que compre"
          text="Comparte tu enlace, tus amigos ahorran y tú recibes saldo en cada compra que hagan."
          cta="Quiero mi enlace"
          tone="dark"
        />
        <GrowCard
          icon={Store}
          eyebrow="Distribuidores"
          title="Arma tu negocio con precios por mayor"
          text="Stock permanente, panel de pedidos y soporte prioritario para revendedores."
          cta="Ser distribuidor"
          tone="brand"
        />
      </div>

      {/* Compra protegida */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-surface-ink p-6 text-white ring-1 ring-white/10 md:p-10">
        <div className="absolute inset-0 -z-10 bg-grid-soft opacity-60" />
        <div className="absolute top-1/2 right-10 -z-10 size-80 -translate-y-1/2 rounded-full bg-brand/25 blur-3xl" />
        <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h3 className="text-3xl leading-tight font-extrabold tracking-tight md:text-4xl">
              Compra tranquilo con <span className="text-brand-gradient">ZERG Shield</span>
            </h3>
            <p className="mt-3 max-w-lg text-sm text-white/70">
              Cada compra está protegida desde el pago hasta el último día de tu plan.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "Pago protegido", text: "Si no recibes tu acceso, te devolvemos el dinero." },
                { icon: RefreshCw, title: "Reemplazo gratis", text: "Si algo falla durante tu plan, lo cambiamos sin costo." },
                { icon: Headphones, title: "Soporte real", text: "Personas reales por WhatsApp todos los días." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand/20 text-brand-bright ring-1 ring-brand/40">
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-3 text-sm font-bold">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto hidden aspect-square w-full max-w-[18rem] md:block">
            <div className="absolute inset-4 rounded-full bg-brand-neon/20 blur-2xl" />
            <BrandIcon className="relative size-full rounded-full object-cover shadow-[0_0_80px_-10px_var(--brand-neon)]" />
            <span className="absolute top-6 -left-3 size-8 rotate-45 rounded-md bg-brand-yellow shadow-lg" />
            <span className="absolute -right-2 bottom-16 size-6 rotate-45 rounded-md bg-brand-neon" />
            <span className="absolute right-10 -bottom-1 size-4 rotate-45 rounded bg-brand-yellow" />
          </div>
        </div>
      </section>
    </div>
  );
}

function GrowCard({
  icon: Icon,
  eyebrow,
  title,
  text,
  cta,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  tone: "dark" | "brand";
}) {
  const dark = tone === "dark";
  return (
    <Link
      href="#"
      className={
        "group relative isolate flex min-h-60 flex-col justify-between overflow-hidden rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 md:p-8 " +
        (dark
          ? "bg-[linear-gradient(130deg,#0b2236,#071512_70%)] text-white ring-1 ring-white/10"
          : "bg-brand-gradient text-brand-ink")
      }
    >
      <div className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-checker opacity-50 [mask-image:linear-gradient(to_left,black,transparent)]" />
      <Icon
        className={
          "absolute -right-4 -bottom-4 -z-10 size-40 transition-transform duration-500 group-hover:scale-110 " +
          (dark ? "text-brand/20" : "text-brand-ink/10")
        }
      />
      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase opacity-70">
          <Percent className="size-3.5" />
          {eyebrow}
        </p>
        <h3 className="mt-3 max-w-sm text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h3>
        <p className="mt-2 max-w-sm text-sm opacity-75">{text}</p>
      </div>
      <span
        className={
          "mt-6 inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold " +
          (dark ? "bg-brand text-brand-ink" : "bg-brand-ink text-white")
        }
      >
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
