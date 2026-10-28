"use client";

import { Bitcoin, Check, CreditCard, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetodoPago, PaymentMethodOption } from "@/types";

export const METHOD_INFO: Record<MetodoPago, { icon: typeof CreditCard; title: string; text: string }> = {
  DIRECTO: { icon: Smartphone, title: "Yape, Plin o transferencia", text: "Pagas desde tu app y subes la captura. Lo confirmamos en minutos." },
  IZIPAY: { icon: CreditCard, title: "Tarjeta de crédito o débito", text: "Visa, Mastercard, Amex y Diners con Izipay. Confirmación inmediata." },
  BINANCE_PAY: { icon: Bitcoin, title: "Binance Pay (USDT)", text: "Paga con tu cuenta de Binance escaneando un QR." },
};

// Métodos de pago como tarjetas grandes y fáciles de elegir. Los no configurados se ven como "Próximamente".
export function MethodPicker({ methods, value, onChange, className }: {
  methods: PaymentMethodOption[];
  value: MetodoPago | null;
  onChange: (metodo: MetodoPago) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Método de pago" className={cn("grid gap-3", className)}>
      {methods.map((m) => {
        const info = METHOD_INFO[m.metodo];
        const selected = value === m.metodo;
        return (
          <button
            key={m.metodo}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!m.disponible}
            onClick={() => onChange(m.metodo)}
            className={cn(
              "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
              selected ? "border-brand-strong bg-brand-mint ring-3 ring-brand/20" : "hover:border-foreground/25",
              !m.disponible && "cursor-not-allowed opacity-55 hover:border-border"
            )}
          >
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", selected ? "bg-brand text-brand-ink" : "bg-muted text-foreground")}>
              <info.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 font-bold">
                {info.title}
                {!m.disponible && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Próximamente</span>
                )}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{info.text}</span>
            </span>
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", selected && "border-brand-strong bg-brand-strong text-white")}>
              {selected && <Check className="size-3.5" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
