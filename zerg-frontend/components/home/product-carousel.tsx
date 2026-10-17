import { ProductCard } from "@/components/product/product-card";
import { Rail } from "./rail";
import type { Product } from "@/types";

export function ProductCarousel({ title, products }: { title: string; products: Product[] }) {
  return (
    <Rail title={title} itemClassName="w-[78%] sm:w-[45%] md:w-[31%] lg:w-[23.5%] xl:w-[19%]">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </Rail>
  );
}
