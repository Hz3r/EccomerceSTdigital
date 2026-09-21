"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.producto.nombre}</p>
        <p className="text-xs text-muted-foreground">{item.plan.nombre} - {item.plan.duracion}</p>
        <p className="mt-1 text-sm font-semibold">${item.plan.precio.toFixed(2)}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => updateQuantity(item.planId, item.cantidad - 1)}
        >
          <Minus className="size-3" />
        </Button>
        <span className="w-6 text-center text-sm">{item.cantidad}</span>
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => updateQuantity(item.planId, item.cantidad + 1)}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold">${(item.plan.precio * item.cantidad).toFixed(2)}</p>
        <Button
          variant="ghost"
          size="icon-xs"
          className="mt-1 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(item.planId)}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  );
}
