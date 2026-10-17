import Link from "next/link";
import { ProductCover } from "./product-cover";
import { activePlans, bestDiscount, cheapestPlan, formatPrice } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function planCountLabel(product: Product) {
  const n = activePlans(product).length;
  return `${n} ${n === 1 ? "plan" : "planes"}`;
}

// Tarjeta compacta: portada con insignia y nombre. Para tendencias y carruseles.
export function ProductTile({
  product,
  size = "sm",
  className,
}: {
  product: Product;
  size?: "sm" | "lg";
  className?: string;
}) {
  const plan = cheapestPlan(product);
  const discount = bestDiscount(product);

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl ring-1 ring-border transition-all duration-300 hover:-translate-y-0.5 hover:ring-brand/60 hover:shadow-[0_16px_40px_-18px_rgb(5_196_138/0.55)]",
        className
      )}
    >
      <ProductCover
        product={product}
        size={size === "lg" ? "lg" : "md"}
        showCategory={false}
        className="absolute inset-0 [&>div:last-child]:pb-10"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <span
        className={cn(
          "absolute top-2.5 right-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold",
          discount > 0 ? "bg-brand-yellow text-brand-ink" : "bg-black/45 text-white backdrop-blur-sm"
        )}
      >
        {discount > 0 ? `-${discount}%` : planCountLabel(product)}
      </span>

      <div className={cn("absolute inset-x-0 bottom-0 text-white", size === "lg" ? "p-6" : "p-3")}>
        <p className={cn("line-clamp-1 font-bold", size === "lg" ? "text-2xl md:text-3xl" : "text-sm")}>
          {product.nombre}
        </p>
        {plan && (
          <p className={cn("mt-0.5 text-white/75", size === "lg" ? "text-sm" : "text-[11px]")}>
            Desde <span className="font-semibold text-brand-bright">{formatPrice(plan.precio)}</span>
            {size === "lg" && <> · {planCountLabel(product)}</>}
          </p>
        )}
      </div>
    </Link>
  );
}
