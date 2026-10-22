"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Package, Send, ShoppingBag, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { formatPrice } from "@/lib/catalog";
import { useLiveVersion } from "@/lib/live";
import { cn } from "@/lib/utils";
import type { EstadoPago, Order, StatusOrden } from "@/types";

const PAYMENT: Record<EstadoPago, { label: string; className: string }> = {
  PENDIENTE: { label: "Pago pendiente", className: "bg-brand-yellow/20 text-foreground" },
  EN_REVISION: { label: "Pago en revisión", className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  PAGADO: { label: "Pagado", className: "bg-brand/15 text-brand-strong" },
  RECHAZADO: { label: "Pago rechazado", className: "bg-destructive/10 text-destructive" },
};

const STATUS: Record<StatusOrden, { label: string; icon: typeof Clock; className: string; hint: string }> = {
  PENDIENTE: { label: "En revisión", icon: Clock, className: "bg-brand-yellow/20 text-foreground", hint: "Estamos confirmando tu pago." },
  ENVIADO: { label: "Enviado", icon: Send, className: "bg-sky-500/15 text-sky-700 dark:text-sky-300", hint: "Revisa tu correo y WhatsApp: ya te enviamos tus accesos." },
  COMPLETADO: { label: "Completado", icon: CheckCircle2, className: "bg-brand/15 text-brand-strong", hint: "¡Listo! Disfruta tu servicio." },
  CANCELADO: { label: "Cancelado", icon: XCircle, className: "bg-destructive/10 text-destructive", hint: "Este pedido fue cancelado." },
};

const dateFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" });

// Pedidos del cliente que inició sesión. Con ?orden=ORD-… (desde una notificación) se resalta ese pedido.
export function MyOrders() {
  const highlighted = useSearchParams().get("orden");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);
  const version = useLiveVersion("orders");
  const highlightRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: Order[] }>("/orders/mine")
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data.data);
        setError(false);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [version]);

  useEffect(() => {
    if (orders && highlighted) highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [orders, highlighted]);

  return (
    <section id="pedidos" className="mt-8 scroll-mt-28">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Mis pedidos</h2>
          <p className="text-sm text-muted-foreground">Tus órdenes de compra y su estado, actualizado en tiempo real.</p>
        </div>
        {orders && orders.length > 0 && <span className="text-sm text-muted-foreground">{orders.length} en total</span>}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No pudimos cargar tus pedidos. Intenta de nuevo en unos segundos.
        </p>
      ) : !orders ? (
        <div className="mt-6 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand/15 text-brand-strong">
            <ShoppingBag className="size-6" />
          </span>
          <p className="mt-4 font-bold">Aún no tienes pedidos</p>
          <p className="mt-1 text-sm text-muted-foreground">Cuando compres algo, aquí verás su estado.</p>
          <Button className="mt-5 rounded-lg" render={<Link href="/products" />} nativeButton={false}>
            Ver productos
          </Button>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => {
            const status = STATUS[order.status];
            const isHighlighted = order.numeroOrden === highlighted;
            return (
              <li
                key={order.id}
                ref={isHighlighted ? highlightRef : undefined}
                className={cn("rounded-2xl border bg-card p-5 transition-shadow", isHighlighted && "border-brand ring-3 ring-brand/20")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">{order.numeroOrden}</p>
                    <p className="text-xs text-muted-foreground">{dateFormat.format(new Date(order.creadoEn))}</p>
                  </div>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {order.payment && order.status !== "CANCELADO" && (
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", PAYMENT[order.payment.estado].className)}>
                        {PAYMENT[order.payment.estado].label}
                      </span>
                    )}
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", status.className)}>
                      <status.icon className="size-3.5" />
                      {status.label}
                    </span>
                  </span>
                </div>
                <ul className="mt-4 space-y-2 border-t pt-4 text-sm">
                  {order.items?.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <Package className="size-4 shrink-0 text-muted-foreground" />
                        {item.plan?.product?.slug ? (
                          <Link href={`/product/${item.plan.product.slug}`} className="truncate hover:text-brand-strong">
                            {item.plan.product.nombre}
                          </Link>
                        ) : (
                          <span className="truncate">{item.plan?.product?.nombre ?? "Producto"}</span>
                        )}
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {item.plan?.duracion} ×{item.cantidad}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium">{formatPrice(Number(item.precioUnitario) * item.cantidad)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                  <p className="text-xs text-muted-foreground">{status.hint}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm">
                      Total <span className="text-lg font-black tracking-tight">{formatPrice(Number(order.total))}</span>
                    </p>
                    {order.status !== "CANCELADO" && order.payment && order.payment.estado !== "PAGADO" && (
                      <Button size="sm" className="rounded-lg" render={<Link href={`/pago/${order.numeroOrden}`} />} nativeButton={false}>
                        {order.payment.estado === "EN_REVISION" ? "Ver pago" : "Pagar"}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
