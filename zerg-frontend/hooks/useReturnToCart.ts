"use client";

import { useCallback } from "react";
import { cancelMyOrder, getProducts } from "@/lib/api";
import { activePlans } from "@/lib/catalog";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/types";

/**
 * Cancela la orden sin pagar y regresa sus productos al carrito.
 * Devuelve cuántos productos volvieron (los planes que ya no se venden se omiten).
 */
export function useReturnToCart() {
  const { restoreItems } = useCart();

  return useCallback(
    async (numeroOrden: string) => {
      const items = await cancelMyOrder(numeroOrden);
      const products = await getProducts().catch(() => []);
      const restored: CartItem[] = [];
      for (const { planId, cantidad } of items) {
        const product = products.find((p) => p.plans?.some((pl) => pl.id === planId));
        const plan = product && activePlans(product).find((pl) => pl.id === planId);
        if (product && plan) restored.push({ planId, plan, producto: product, cantidad });
      }
      restoreItems(restored);
      return restored.length;
    },
    [restoreItems]
  );
}
