"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { loginHref } from "@/lib/auth-redirect";
import { CartItem } from "@/components/cart/cart-item";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { user, isLoading } = useAuth();
  const mustLogin = !isLoading && !user;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
        Carrito <span className="text-brand-strong">({totalItems})</span>
      </h1>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed py-20 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-brand/15 text-brand-strong">
            <ShoppingCart className="size-7" />
          </span>
          <p className="mt-5 text-lg font-bold">Tu carrito está vacío</p>
          <p className="mt-1 text-sm text-muted-foreground">Descubre nuestros servicios y empieza a disfrutar hoy.</p>
          <Button className="mt-6 h-10 rounded-lg px-5" render={<Link href="/products" />} nativeButton={false}>
            Ver productos
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="divide-y rounded-3xl border bg-card">
              {items.map((item) => (
                <CartItem key={item.planId} item={item} />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-brand-strong">
                <ArrowLeft className="size-4" />
                Seguir comprando
              </Link>
              <button type="button" onClick={clearCart} className="text-sm text-muted-foreground hover:text-destructive">
                Vaciar carrito
              </button>
            </div>
          </div>

          <OrderSummary items={items} totalPrice={totalPrice}>
            <Button
              className="h-12 w-full rounded-xl text-base font-semibold"
              render={<Link href={mustLogin ? loginHref("/checkout") : "/checkout"} />}
              nativeButton={false}
            >
              {mustLogin ? <Lock className="size-4" /> : null}
              {mustLogin ? "Ingresar para pagar" : "Continuar con el pago"}
              <ArrowRight className="size-4" />
            </Button>
            {mustLogin && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Ingresa o crea tu cuenta (también con Google). Tu carrito se mantiene.
              </p>
            )}
          </OrderSummary>
        </div>
      )}
    </div>
  );
}
