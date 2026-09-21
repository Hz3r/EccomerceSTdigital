"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "@/components/cart/cart-item";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Carrito de compras</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? "artículo" : "artículos"} en tu carrito
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ShoppingCart className="size-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Tu carrito está vacío</p>
          <Link href="/products" className="mt-4">
            <Button variant="outline">
              <ArrowLeft className="size-4" />
              Ver productos
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <CartItem key={item.planId} item={item} />
          ))}

          <Separator className="my-6" />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={clearCart}>
              Limpiar carrito
            </Button>
            <Link href="/checkout" className="flex-1">
              <Button className="w-full">Proceder al checkout</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
