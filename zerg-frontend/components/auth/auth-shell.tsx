import Image from "next/image";
import { ShieldCheck, Zap, Headphones } from "lucide-react";

const PERKS = [
  { icon: Zap, text: "Entrega inmediata de tus accesos" },
  { icon: ShieldCheck, text: "Garantía durante todo tu plan" },
  { icon: Headphones, text: "Soporte humano por WhatsApp" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="bg-brand-mint/60 px-4 py-10 md:px-6 md:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-[0_30px_60px_-30px_rgb(7_21_18/0.3)] md:grid-cols-2">
        <div className="relative isolate hidden flex-col justify-between overflow-hidden bg-surface-ink p-10 text-white md:flex">
          <div className="absolute inset-0 -z-10 bg-grid-soft opacity-60" />
          <div className="absolute -top-20 -left-20 -z-10 size-72 rounded-full bg-brand/30 blur-3xl" />
          <Image src="/zerg-icon.png" alt="" width={96} height={96} className="size-20 rounded-full" />
          <div>
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight">
              Tu entretenimiento,
              <br />
              <span className="text-brand-gradient">sin complicaciones.</span>
            </h2>
            <ul className="mt-8 space-y-4">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand/20 text-brand">
                    <Icon className="size-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <span className="absolute right-10 bottom-10 size-6 rotate-45 rounded-md bg-brand-yellow" />
          <span className="absolute right-20 bottom-20 size-4 rotate-45 rounded bg-brand-neon" />
        </div>

        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}
