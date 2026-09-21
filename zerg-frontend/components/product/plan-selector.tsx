"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import type { Plan, Product } from "@/types";

interface PlanSelectorProps {
  plans: Plan[];
  product: Product;
}

export function PlanSelector({ plans, product }: PlanSelectorProps) {
  const { addItem, items } = useCart();
  const activePlans = plans.filter((p) => p.isActivo);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Selecciona un plan</h3>
      <div className="space-y-2">
        {activePlans.map((plan) => {
          const isInCart = items.some((i) => i.planId === plan.id);
          return (
            <div
              key={plan.id}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{plan.nombre}</span>
                  {plan.precioOriginal && plan.precioOriginal > plan.precio && (
                    <Badge variant="destructive" className="text-[10px]">
                      -{Math.round(((plan.precioOriginal - plan.precio) / plan.precioOriginal) * 100)}%
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  {plan.precioOriginal && plan.precioOriginal > plan.precio && (
                    <span className="text-xs text-muted-foreground line-through">
                      ${plan.precioOriginal.toFixed(2)}
                    </span>
                  )}
                  <span className="text-sm font-semibold">${plan.precio.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">/ {plan.duracion}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant={isInCart ? "outline" : "default"}
                onClick={() => addItem(plan, product)}
              >
                {isInCart ? (
                  <>
                    <Check className="size-3.5" />
                    Agregado
                  </>
                ) : (
                  <>
                    <ShoppingCart className="size-3.5" />
                    Agregar
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
