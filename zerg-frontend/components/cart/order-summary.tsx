import { ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import type { CartItem } from "@/types";

export function OrderSummary({
  items,
  totalPrice,
  children,
  showItems = false,
}: {
  items: CartItem[];
  totalPrice: number;
  children?: React.ReactNode;
  showItems?: boolean;
}) {
  const savings = items.reduce(
    (sum, i) =>
      sum + (i.plan.precioOriginal && i.plan.precioOriginal > i.plan.precio ? (i.plan.precioOriginal - i.plan.precio) * i.cantidad : 0),
    0
  );

  return (
    <aside className="self-start rounded-3xl bg-brand-mint p-6 ring-1 ring-brand/15 lg:sticky lg:top-36">
      <h2 className="text-lg font-extrabold tracking-tight">Resumen del pedido</h2>

      {showItems && (
        <ul className="mt-4 space-y-3 border-b border-brand/15 pb-4">
          {items.map((i) => (
            <li key={i.planId} className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {i.producto.nombre} <span className="text-xs">({i.plan.duracion})</span> ×{i.cantidad}
              </span>
              <span className="font-medium">{formatPrice(i.plan.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatPrice(totalPrice + savings)}</dd>
        </div>
        {savings > 0 && (
          <div className="flex justify-between text-brand-strong">
            <dt>Descuentos</dt>
            <dd className="font-semibold">-{formatPrice(savings)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Entrega</dt>
          <dd className="font-semibold text-brand-strong">Gratis · inmediata</dd>
        </div>
        <div className="flex items-end justify-between border-t border-brand/15 pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="text-2xl font-black tracking-tight">{formatPrice(totalPrice)}</dd>
        </div>
      </dl>

      {children && <div className="mt-6">{children}</div>}

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 text-brand-strong" />
        Compra protegida con garantía durante todo tu plan.
      </p>
    </aside>
  );
}
