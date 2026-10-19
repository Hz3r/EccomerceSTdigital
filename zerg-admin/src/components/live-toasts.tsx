"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { MessageSquareQuote, ShoppingCart, X } from "lucide-react";
import { useLiveEvents, type LiveEvent } from "@/lib/live";

interface Toast {
  id: number;
  href: string;
  title: string;
  text: string;
  icon: typeof ShoppingCart;
}

// Avisos en vivo cuando llega algo nuevo desde la tienda.
export function LiveToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const onEvent = useCallback((e: LiveEvent) => {
    let toast: Omit<Toast, "id"> | null = null;
    if (e.topic === "orders" && e.action === "created") {
      toast = { href: "/orders", title: "Nueva orden recibida", text: "Un cliente acaba de comprar en la tienda.", icon: ShoppingCart };
    } else if (e.topic === "reviews" && e.action === "created") {
      toast = { href: "/reviews", title: "Nueva reseña", text: "Revísala y apruébala para mostrarla.", icon: MessageSquareQuote };
    }
    if (!toast) return;
    const id = e.at + Math.random();
    setToasts((t) => [...t.slice(-2), { id, ...toast }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 8000);
  }, []);

  useLiveEvents(onEvent);

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-brand/40 bg-popover p-4 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong dark:text-brand-bright">
            <t.icon className="size-4" />
          </span>
          <Link href={t.href} onClick={() => dismiss(t.id)} className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t.title}</span>
            <span className="block text-xs text-muted-foreground">{t.text}</span>
          </Link>
          <button type="button" aria-label="Cerrar aviso" onClick={() => dismiss(t.id)} className="rounded p-1 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
