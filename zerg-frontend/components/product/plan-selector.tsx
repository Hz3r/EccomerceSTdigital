"use client";

import { Check } from "lucide-react";
import { discountPercent, formatPrice } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

interface PlanSelectorProps {
  plans: Plan[];
  value?: string;
  onChange: (planId: string) => void;
}

export function PlanSelector({ plans, value, onChange }: PlanSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Plan" className="grid grid-cols-2 gap-2">
      {plans.map((plan) => {
        const selected = plan.id === value;
        const discount = discountPercent(plan);
        return (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(plan.id)}
            className={cn(
              "relative flex flex-col items-start rounded-xl border bg-background px-3.5 py-3 text-left transition-all",
              selected
                ? "border-brand-strong ring-3 ring-brand/20"
                : "hover:border-foreground/25"
            )}
          >
            {discount > 0 && (
              <span className="absolute -top-2 right-2 rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-bold text-brand-ink">
                -{discount}%
              </span>
            )}
            <span className="flex w-full items-center justify-between text-sm font-semibold">
              {plan.nombre}
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border",
                  selected ? "border-brand-strong bg-brand-strong text-white" : "border-input"
                )}
              >
                {selected && <Check className="size-3" />}
              </span>
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {plan.nombre !== plan.duracion && `${plan.duracion} · `}
              {formatPrice(plan.precio)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
