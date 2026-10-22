"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MethodPicker, METHOD_INFO } from "@/components/payments/method-picker";
import { BinancePayment, DirectPayment, IzipayPayment, PaymentStatus } from "@/components/payments/payment-steps";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { apiErrorMessage, loginHref } from "@/lib/auth-redirect";
import { formatPrice } from "@/lib/catalog";
import { useLiveVersion } from "@/lib/live";
import { cn } from "@/lib/utils";
import type { MetodoPago, Order, PaymentMethodOption } from "@/types";

type OrderPayment = Order & { methods: PaymentMethodOption[] };

// "Paga tu pedido": instrucciones y pago según el método elegido. Se actualiza en vivo
// cuando el admin confirma o rechaza el pago o llega la confirmación de Izipay o Binance.
export default function PayOrderPage() {
  const { orden } = useParams<{ orden: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [data, setData] = useState<OrderPayment | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [changing, setChanging] = useState(false);
  const [showMethods, setShowMethods] = useState(false);
  const version = useLiveVersion("orders");

  useEffect(() => {
    if (!isLoading && !user) router.replace(loginHref(`/pago/${orden}`));
  }, [isLoading, user, orden, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .get<{ data: OrderPayment }>(`/payments/order/${orden}`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data.data);
        setError("");
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "No pudimos cargar tu pedido.")));
    return () => {
      cancelled = true;
    };
  }, [user, orden, version, refresh]);

  const reload = useCallback(() => setRefresh((r) => r + 1), []);

  const changeMethod = async (metodo: MetodoPago) => {
    setChanging(true);
    try {
      const res = await api.post<{ data: OrderPayment }>(`/payments/order/${orden}/method`, { metodo });
      setData(res.data.data);
      setShowMethods(false);
      toast.info("Método de pago actualizado", METHOD_INFO[metodo].title);
    } catch (err) {
      toast.info("No se pudo cambiar el método", apiErrorMessage(err, "Intenta de nuevo."));
    } finally {
      setChanging(false);
    }
  };

  if (error && !data) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <p className="text-2xl font-extrabold">No pudimos abrir el pago</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6 rounded-lg" render={<Link href="/account#pedidos" />} nativeButton={false}>
          Ver mis pedidos
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const payment = data.payment;
  const settled = payment && (payment.estado === "PAGADO" || payment.estado === "EN_REVISION");
  const canChange = !settled && data.status !== "CANCELADO";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <Link href="/account#pedidos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Mis pedidos
      </Link>
      <div className="mt-3 flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {payment?.estado === "PAGADO" ? "Pedido pagado" : "Paga tu pedido"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Pedido <span className="font-mono font-semibold text-foreground">{data.numeroOrden}</span>
          {payment && <> · {METHOD_INFO[payment.metodo].title}</>}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {data.status === "CANCELADO" ? (
            <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">Este pedido fue cancelado.</p>
          ) : !payment ? (
            <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">Elige un método de pago para continuar.</p>
          ) : settled ? (
            <PaymentStatus payment={payment} />
          ) : payment.metodo === "DIRECTO" ? (
            <DirectPayment payment={payment} onUpdated={reload} />
          ) : payment.metodo === "IZIPAY" ? (
            <IzipayPayment payment={payment} onUpdated={reload} />
          ) : (
            <BinancePayment payment={payment} />
          )}

          {canChange && (
            <div className="rounded-3xl border">
              <button
                type="button"
                aria-expanded={showMethods || !payment}
                onClick={() => setShowMethods((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold"
              >
                ¿Prefieres pagar de otra forma?
                <ChevronDown className={cn("size-4 transition-transform", (showMethods || !payment) && "rotate-180")} />
              </button>
              {(showMethods || !payment) && (
                <div className="border-t p-5">
                  <MethodPicker
                    methods={data.methods}
                    value={payment?.metodo ?? null}
                    onChange={(m) => m !== payment?.metodo && changeMethod(m)}
                  />
                  {changing && <p className="mt-3 text-sm text-muted-foreground">Cambiando método…</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="self-start rounded-3xl bg-brand-mint p-6 ring-1 ring-brand/15 lg:sticky lg:top-36">
          <h2 className="text-lg font-extrabold tracking-tight">Resumen</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {data.items?.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <Package className="size-4 shrink-0" />
                  <span className="truncate">
                    {item.plan?.product?.nombre} <span className="text-xs">({item.plan?.duracion}) ×{item.cantidad}</span>
                  </span>
                </span>
                <span className="shrink-0 font-medium">{formatPrice(Number(item.precioUnitario) * item.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-end justify-between border-t border-brand/15 pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-black tracking-tight">{formatPrice(Number(data.total))}</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">¿Dudas con el pago? Escríbenos con el botón de ayuda de abajo a la derecha.</p>
        </aside>
      </div>
    </div>
  );
}
