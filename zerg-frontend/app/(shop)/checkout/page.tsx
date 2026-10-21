"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { createOrder } from "@/lib/api";
import { apiErrorMessage, loginHref } from "@/lib/auth-redirect";
import { formatPrice } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderSummary } from "@/components/cart/order-summary";
import { ArrowLeft, Check, CheckCircle2, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const PAYMENT_METHODS = [
  { id: "yape", label: "Yape" },
  { id: "plin", label: "Plin" },
  { id: "tarjeta", label: "Tarjeta" },
  { id: "paypal", label: "PayPal" },
];

const STEPS = ["Carrito", "Datos y pago", "Confirmación"];

function Steps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 text-xs font-semibold md:gap-3">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2 md:gap-3">
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[11px]",
              i < current && "bg-brand text-brand-ink",
              i === current && "bg-surface-ink text-white",
              i > current && "bg-muted text-muted-foreground"
            )}
          >
            {i < current ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span className={cn("hidden sm:inline", i > current && "text-muted-foreground")}>{s}</span>
          {i < STEPS.length - 1 && <span className="h-px w-6 bg-border md:w-10" />}
        </li>
      ))}
    </ol>
  );
}

// Comprar requiere cuenta: sin sesión se envía al login y, al ingresar, se vuelve aquí con el carrito intacto.
export default function CheckoutPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const needsLogin = !isLoading && !user;

  useEffect(() => {
    if (needsLogin) router.replace(loginHref("/checkout"));
  }, [needsLogin, router]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <Checkout user={user} />;
}

function Checkout({ user }: { user: User }) {
  const { items, totalPrice, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].id);
  const [form, setForm] = useState({
    nombreCliente: user.nombre,
    email: user.email,
    telefono: "",
    notas: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    setError("");
    try {
      const paymentLabel = PAYMENT_METHODS.find((m) => m.id === payment)?.label;
      const order = await createOrder({
        ...form,
        notas: [`Método de pago: ${paymentLabel}`, form.notas].filter(Boolean).join(" · "),
        items: items.map((i) => ({
          planId: i.planId,
          cantidad: i.cantidad,
        })),
      });
      setOrderNumber(order.numeroOrden);
      setIsSuccess(true);
      clearCart();
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos procesar tu pedido. Inténtalo de nuevo en unos segundos."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center md:px-6">
        <div className="flex justify-center">
          <Steps current={2} />
        </div>
        <span className="mx-auto mt-10 flex size-20 items-center justify-center rounded-full bg-brand/15">
          <CheckCircle2 className="size-10 text-brand-strong" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">¡Pedido recibido!</h1>
        <p className="mt-2 text-muted-foreground">
          Tu número de orden es{" "}
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono font-semibold text-foreground">{orderNumber}</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Te enviaremos las instrucciones de pago y tus accesos a tu correo y WhatsApp.
        </p>
        <Button className="mt-8 h-11 rounded-xl px-6" render={<Link href="/products" />} nativeButton={false}>
          Seguir comprando
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center md:px-6">
        <p className="text-lg font-bold">No hay artículos en tu carrito</p>
        <Button variant="outline" className="mt-5 rounded-lg" render={<Link href="/products" />} nativeButton={false}>
          <ArrowLeft className="size-4" />
          Ver productos
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Finalizar compra</h1>
        <Steps current={1} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="font-bold">Tus datos</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Aquí te enviaremos tus accesos.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="nombreCliente" label="Nombre completo">
                <Input
                  id="nombreCliente"
                  className="h-11 rounded-xl"
                  value={form.nombreCliente}
                  onChange={(e) => setForm({ ...form, nombreCliente: e.target.value })}
                  required
                />
              </Field>
              <Field id="email" label="Correo electrónico">
                <Input
                  id="email"
                  type="email"
                  className="h-11 rounded-xl"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </Field>
              <Field id="telefono" label="WhatsApp (opcional)">
                <Input
                  id="telefono"
                  type="tel"
                  className="h-11 rounded-xl"
                  placeholder="+51 999 999 999"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </Field>
              <Field id="notas" label="Notas (opcional)">
                <Input
                  id="notas"
                  className="h-11 rounded-xl"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border bg-card p-6">
            <h2 className="font-bold">Método de pago</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Te enviaremos las instrucciones al confirmar.</p>
            <div role="radiogroup" aria-label="Método de pago" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={payment === m.id}
                  onClick={() => setPayment(m.id)}
                  className={cn(
                    "flex h-14 items-center justify-center rounded-xl border text-sm font-bold transition-all",
                    payment === m.id ? "border-brand-strong bg-brand-mint ring-3 ring-brand/20" : "hover:border-foreground/25"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </form>

        <OrderSummary items={items} totalPrice={totalPrice} showItems>
          <Button
            type="submit"
            form="checkout-form"
            className="h-12 w-full rounded-xl text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Lock className="size-4" />
                Confirmar pedido · {formatPrice(totalPrice)}
              </>
            )}
          </Button>
        </OrderSummary>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
