"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { createOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [form, setForm] = useState({
    nombreCliente: user?.nombre || "",
    email: user?.email || "",
    telefono: "",
    notas: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        ...form,
        userId: user?.id,
        items: items.map((i) => ({
          planId: i.planId,
          cantidad: i.cantidad,
        })),
      });
      setOrderNumber(order.numeroOrden);
      setIsSuccess(true);
      clearCart();
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center md:px-6">
        <CheckCircle className="mx-auto size-16 text-green-500" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">¡Compra realizada!</h1>
        <p className="mt-2 text-muted-foreground">
          Tu número de orden es <span className="font-mono font-semibold">{orderNumber}</span>
        </p>
        <Link href="/products" className="mt-6 inline-block">
          <Button>Seguir comprando</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center md:px-6">
        <p className="text-muted-foreground">No hay artículos en tu carrito</p>
        <Link href="/products" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Ver productos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completa tus datos para finalizar la compra
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreCliente">Nombre completo</Label>
            <Input
              id="nombreCliente"
              value={form.nombreCliente}
              onChange={(e) => setForm({ ...form, nombreCliente: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono (opcional)</Label>
            <Input
              id="telefono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Input
              id="notas"
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando...
              </>
            ) : (
              `Pagar $${totalPrice.toFixed(2)}`
            )}
          </Button>
        </form>

        <div className="rounded-xl border p-4">
          <h2 className="font-semibold">Resumen del pedido</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.planId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.producto.nombre} x{item.cantidad}
                </span>
                <span>${(item.plan.precio * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
