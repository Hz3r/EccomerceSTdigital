"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getProductBySlug, getReviewsByProduct } from "@/lib/api";
import { PlanSelector } from "@/components/product/plan-selector";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { Product, Review } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      getProductBySlug(slug).catch(() => null),
    ])
      .then(([prod]) => {
        if (prod) {
          setProduct(prod);
          if (prod.reviews) {
            setReviews(prod.reviews.filter((r) => r.isApproved));
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-64 rounded-xl bg-muted" />
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <p className="text-muted-foreground">Producto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {product.imagenUrl ? (
            <Image
              src={product.imagenUrl}
              alt={product.nombre}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-6xl">📦</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {product.category && (
            <Badge variant="secondary" className="w-fit">
              {product.category.nombre}
            </Badge>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{product.nombre}</h1>
          {product.descripcion && (
            <p className="text-muted-foreground">{product.descripcion}</p>
          )}

          {product.plans && product.plans.length > 0 && (
            <PlanSelector plans={product.plans} product={product} />
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900">Reseñas</h2>
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${
                          i < review.puntuacion
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {review.user?.nombre}
                  </span>
                </div>
                {review.comentario && (
                  <p className="mt-2 text-sm">{review.comentario}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
