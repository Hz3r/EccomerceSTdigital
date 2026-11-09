"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useReturnToCart } from "@/hooks/useReturnToCart";
import { getUnpaidOrder } from "@/lib/api";
import { isBeingPaid } from "@/lib/paying";

/**
 * Un pedido sin pagar no se queda "pendiente": si el cliente lo dejó (cerró la pestaña o salió sin
 * cancelar), al volver a la tienda sus productos regresan solos al carrito y la orden se elimina.
 * No se toca el pedido de la página de pago abierta (aquí o en otra pestaña).
 */
export function UnpaidOrderReturn() {
  const { user } = useAuth();
  const pathname = usePathname();
  const returnToCart = useReturnToCart();
  const checkedFor = useRef<string | null>(null);
  const onPaymentPage = pathname.startsWith("/pago/");

  useEffect(() => {
    // Al salir de la página de pago se vuelve a revisar (por si salió sin cancelar ni pagar)
    if (onPaymentPage) {
      checkedFor.current = null;
      return;
    }
    if (!user || checkedFor.current === user.id) return;
    checkedFor.current = user.id;
    let cancelled = false;
    getUnpaidOrder()
      .then(async (order) => {
        if (cancelled || !order || isBeingPaid(order.numeroOrden)) return;
        const count = await returnToCart(order.numeroOrden);
        if (count > 0) toast.info("Tu pedido sin pagar volvió al carrito", `${order.numeroOrden} no se pagó: tus productos te esperan en el carrito.`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, onPaymentPage, returnToCart]);

  return null;
}
