"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Loader2, LogIn, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Rating } from "@/components/product/rating";
import { useAuth } from "@/hooks/useAuth";
import { useSite } from "@/hooks/useSiteSettings";
import api from "@/lib/axios";
import { USE_MOCKS } from "@/lib/api";
import { useLiveVersion } from "@/lib/live";
import { apiErrorMessage, loginHref } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

const MAX = 1000;
const LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

interface MyReview {
  id: string;
  productId: string;
  puntuacion: number;
  comentario?: string | null;
  respuesta?: string | null;
  isApproved: boolean;
}

// Respuesta pública de la tienda bajo una reseña.
export function StoreReply({ text }: { text: string }) {
  const { settings } = useSite();
  return (
    <div className="mt-4 rounded-xl border-l-2 border-brand bg-muted/60 px-3 py-2.5">
      <p className="text-xs font-semibold">Respuesta de {settings.marca.nombre}</p>
      <p className="mt-0.5 text-sm whitespace-pre-line text-muted-foreground">{text}</p>
    </div>
  );
}

// Escribir una reseña requiere sesión (una por producto; se publica cuando el admin la aprueba).
export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const { user, isLoading } = useAuth();
  const [mine, setMine] = useState<MyReview | null | undefined>(undefined);
  const [puntuacion, setPuntuacion] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  // Pasa de "Pendiente" a "Publicada" en vivo cuando el admin la aprueba
  const version = useLiveVersion("reviews");

  useEffect(() => {
    if (!user || USE_MOCKS) return;
    let cancelled = false;
    api
      .get<{ data: MyReview[] }>("/reviews/mine")
      .then((res) => !cancelled && setMine(res.data.data.find((r) => r.productId === productId) ?? null))
      .catch(() => !cancelled && setMine(null));
    return () => {
      cancelled = true;
    };
  }, [user, productId, version]);

  if (isLoading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">¿Ya usaste este servicio?</p>
          <p className="text-sm text-muted-foreground">Inicia sesión para dejar tu reseña y ayudar a otros clientes.</p>
        </div>
        <Button className="rounded-lg" render={<Link href={loginHref(`/product/${slug}#resenas`)} />} nativeButton={false}>
          <LogIn className="size-4" />
          Iniciar sesión para opinar
        </Button>
      </div>
    );
  }

  if (mine === undefined && !USE_MOCKS) {
    return (
      <div className="flex h-24 items-center justify-center rounded-2xl border">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mine) {
    return (
      <div className="rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Tu reseña</p>
          {mine.isApproved ? (
            <span className="rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand-strong">Publicada</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow/20 px-2.5 py-1 text-xs font-semibold">
              <Clock className="size-3.5" />
              Pendiente de aprobación
            </span>
          )}
        </div>
        <Rating value={mine.puntuacion} className="mt-2" />
        {mine.comentario && <p className="mt-2 text-sm">“{mine.comentario}”</p>}
        {mine.respuesta && <StoreReply text={mine.respuesta} />}
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (puntuacion === 0) {
      setError("Elige de 1 a 5 estrellas.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await api.post<{ data: MyReview }>("/reviews", { productId, puntuacion, comentario: comentario.trim() || undefined });
      setMine(res.data.data);
      toast.success("¡Gracias por tu reseña!", "La publicaremos en cuanto la revisemos.");
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos enviar tu reseña. Intenta de nuevo."));
    } finally {
      setSending(false);
    }
  };

  const shown = hover || puntuacion;

  return (
    <form onSubmit={submit} className="rounded-2xl border p-5">
      <p className="font-semibold">Escribe tu reseña</p>
      <p className="text-sm text-muted-foreground">Publicando como {user.nombre}.</p>

      <fieldset className="mt-4">
        <legend className="sr-only">Puntuación</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name="puntuacion"
                  value={n}
                  checked={puntuacion === n}
                  onChange={() => setPuntuacion(n)}
                  className="peer sr-only"
                />
                <Star
                  className={cn(
                    "size-7 transition-colors peer-focus-visible:rounded peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                    n <= shown ? "fill-brand-yellow text-brand-yellow" : "text-muted-foreground/40"
                  )}
                />
                <span className="sr-only">{`${n} ${n === 1 ? "estrella" : "estrellas"}`}</span>
              </label>
            ))}
          </div>
          <span className="text-sm font-medium text-muted-foreground">{LABELS[shown]}</span>
        </div>
      </fieldset>

      <label htmlFor="review-comentario" className="mt-4 block text-sm font-medium">
        Comentario <span className="font-normal text-muted-foreground">(opcional)</span>
      </label>
      <textarea
        id="review-comentario"
        rows={3}
        maxLength={MAX}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="¿Qué te pareció el servicio, la entrega y la atención?"
        className="mt-1.5 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
      <div className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground">
        <span role="alert" className="text-destructive">{error}</span>
        <span>
          {comentario.length}/{MAX}
        </span>
      </div>

      <Button type="submit" className="mt-3 rounded-lg" disabled={sending}>
        {sending && <Loader2 className="size-4 animate-spin" />}
        Publicar reseña
      </Button>
    </form>
  );
}
