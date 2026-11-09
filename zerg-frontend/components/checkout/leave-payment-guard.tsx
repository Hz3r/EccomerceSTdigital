"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useReturnToCart } from "@/hooks/useReturnToCart";
import { apiErrorMessage } from "@/lib/auth-redirect";
import { clearPaying, markPaying } from "@/lib/paying";

const CANCEL_EVENT = "zerg:cancel-purchase";

/** Botón "Cancelar compra" de la página de pago: abre la misma confirmación que al salir. */
export function requestCancelPurchase() {
  window.dispatchEvent(new CustomEvent(CANCEL_EVENT));
}

/**
 * Mientras el pedido no está pagado, salir de la página de pago (un enlace, el botón atrás o
 * "Cancelar compra") pide confirmación: seguir con el pago o cancelar la compra. Al cancelar, la
 * orden se elimina y los productos vuelven al carrito, así nunca queda una orden pendiente colgada.
 * Cerrar o recargar la pestaña muestra el aviso del navegador.
 */
export function LeavePaymentGuard({ numeroOrden, active }: { numeroOrden: string; active: boolean }) {
  const router = useRouter();
  const returnToCart = useReturnToCart();
  const [target, setTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Avisa a las otras pestañas que este pedido se está pagando aquí
  useEffect(() => {
    if (!active) return;
    markPaying(numeroOrden);
    const id = setInterval(() => markPaying(numeroOrden), 5000);
    return () => {
      clearInterval(id);
      clearPaying(numeroOrden);
    };
  }, [active, numeroOrden]);

  useEffect(() => {
    if (!active) return;

    // Cerrar o recargar la pestaña: el navegador muestra su propio aviso
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    // Enlaces dentro de la tienda (menú, logo, carrito…): se detienen y se pregunta primero
    const onClick = (e: MouseEvent) => {
      if (!activeRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.closest("[data-leave-guard-ignore]")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setTarget(url.pathname + url.search + url.hash);
    };

    // Botón "atrás": se vuelve a poner la página y se pregunta
    history.pushState(history.state, "", location.href);
    const onPopState = () => {
      if (!activeRef.current) return;
      history.pushState(history.state, "", location.href);
      setTarget("/cart");
    };

    const onCancelRequest = () => setTarget("/cart");

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener(CANCEL_EVENT, onCancelRequest);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener(CANCEL_EVENT, onCancelRequest);
    };
  }, [active]);

  const cancelPurchase = async () => {
    if (!target) return;
    setCancelling(true);
    try {
      await returnToCart(numeroOrden);
      activeRef.current = false;
      clearPaying(numeroOrden);
      toast.info("Compra cancelada", "Tus productos volvieron al carrito.");
      router.push(target);
    } catch (err) {
      toast.info("No se pudo cancelar", apiErrorMessage(err, "Intenta de nuevo en unos segundos."));
    } finally {
      setCancelling(false);
      setTarget(null);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && !cancelling && setTarget(null)}>
      <DialogContent className="sm:max-w-md" data-leave-guard-ignore>
        <DialogHeader>
          <DialogTitle>¿Quieres cancelar tu compra?</DialogTitle>
          <DialogDescription>
            Tu pedido <b className="font-mono text-foreground">{numeroOrden}</b> aún no está pagado. Si lo cancelas, tus productos vuelven al carrito y
            puedes comprarlos cuando quieras.
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-xl bg-brand-mint px-3 py-2 text-sm">¿Ya pagaste? Quédate y sube tu comprobante para que confirmemos tu pedido.</p>
        <DialogFooter className="gap-2 sm:flex-col">
          <Button className="h-11 w-full rounded-xl" onClick={() => setTarget(null)} disabled={cancelling}>
            Seguir con el pago
          </Button>
          <Button variant="outline" className="h-11 w-full rounded-xl" onClick={cancelPurchase} disabled={cancelling}>
            {cancelling ? <Loader2 className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
            Cancelar compra y volver al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
