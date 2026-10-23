import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const CHECKOUT_STEPS = ["Carrito", "Tus datos", "Pago", "¡Listo!"] as const;

/**
 * Progreso de la compra (1 Carrito → 2 Tus datos → 3 Pago → 4 ¡Listo!), igual en todas las páginas del proceso.
 * En el celular se muestra la barra con "Paso N de 4" para no ocupar espacio.
 */
export function CheckoutSteps({ current, className }: { current: number; className?: string }) {
  return (
    <nav aria-label="Progreso de la compra" className={cn("w-full", className)}>
      <div className="sm:hidden">
        <p className="text-xs font-semibold text-muted-foreground">
          Paso {Math.min(current + 1, CHECKOUT_STEPS.length)} de {CHECKOUT_STEPS.length} ·{" "}
          <span className="text-foreground">{CHECKOUT_STEPS[current]}</span>
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden>
          {CHECKOUT_STEPS.map((s, i) => (
            <span key={s} className={cn("h-1.5 rounded-full transition-colors", i <= current ? "bg-brand" : "bg-muted")} />
          ))}
        </div>
      </div>
      <ol className="hidden items-center gap-3 text-xs font-semibold sm:flex">
        {CHECKOUT_STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-3" aria-current={i === current ? "step" : undefined}>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-[11px] transition-colors",
                i < current && "bg-brand text-brand-ink",
                i === current && "bg-surface-ink text-white ring-4 ring-brand/20",
                i > current && "bg-muted text-muted-foreground"
              )}
            >
              {i < current ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(i > current && "text-muted-foreground")}>{s}</span>
            {i < CHECKOUT_STEPS.length - 1 && <span className={cn("h-px w-8 md:w-12", i < current ? "bg-brand" : "bg-border")} />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
