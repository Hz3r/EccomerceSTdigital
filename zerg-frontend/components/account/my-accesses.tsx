"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Check, Copy, ExternalLink, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useLiveVersion } from "@/lib/live";
import { cn } from "@/lib/utils";

type Campo = "usuario" | "contrasena" | "perfil" | "pin" | "enlace" | "notas";

interface Access {
  id: string;
  datos: Partial<Record<Campo, string>> | null;
  venceEn: string | null;
  publicadoEn: string;
  vistoEn: string | null;
  producto: { nombre: string; slug: string; imagenUrl?: string | null };
  plan: string;
  duracion: string;
  numeroOrden: string;
}

const FIELDS: { key: Exclude<Campo, "notas" | "enlace">; label: string; secret?: boolean }[] = [
  { key: "usuario", label: "Usuario / correo" },
  { key: "contrasena", label: "Contraseña", secret: true },
  { key: "perfil", label: "Perfil" },
  { key: "pin", label: "PIN", secret: true },
];

const dateFormat = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });

function daysLeft(venceEn: string) {
  return Math.ceil((new Date(venceEn).getTime() - Date.now()) / 86_400_000);
}

function Field({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [shown, setShown] = useState(!secret);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm font-semibold">{shown ? value : "•".repeat(Math.min(value.length, 10))}</p>
      </div>
      {secret && (
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? `Ocultar ${label}` : `Mostrar ${label}`} className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground">
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      )}
      <button type="button" onClick={copy} aria-label={`Copiar ${label}`} className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground">
        {copied ? <Check className="size-4 text-brand-strong" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

// Datos de acceso que el equipo entregó para cada compra. Al abrir la sección se marcan como vistos.
export function MyAccesses() {
  const [accesses, setAccesses] = useState<Access[] | null>(null);
  const version = useLiveVersion("orders");

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: Access[] }>("/credentials/mine")
      .then((res) => {
        if (cancelled) return;
        setAccesses(res.data.data);
        for (const a of res.data.data) if (!a.vistoEn) api.post(`/credentials/mine/${a.id}/seen`).catch(() => {});
      })
      .catch(() => !cancelled && setAccesses([]));
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (!accesses) {
    return (
      <div className="mt-6 flex justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accesses.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand/15 text-brand-strong">
          <KeyRound className="size-6" />
        </span>
        <p className="mt-4 font-bold">Aún no tienes accesos</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Cuando confirmemos tu pago, aquí aparecerán tus usuarios y contraseñas. También te los enviamos por correo y WhatsApp.
        </p>
        <Button className="mt-5 rounded-xl" render={<Link href="/products" />} nativeButton={false}>
          Ver productos
        </Button>
      </div>
    );
  }

  return (
    <ul className="mt-4 grid gap-4">
      {accesses.map((a) => {
        const left = a.venceEn ? daysLeft(a.venceEn) : null;
        return (
          <li key={a.id} className="overflow-hidden rounded-3xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
              <div>
                <Link href={`/product/${a.producto.slug}`} className="font-bold hover:underline">
                  {a.producto.nombre}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {a.plan} · Pedido {a.numeroOrden}
                </p>
              </div>
              {a.venceEn && left !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                    left < 0 ? "bg-destructive/10 text-destructive" : left <= 5 ? "bg-brand-yellow/25 text-foreground" : "bg-brand/15 text-brand-strong"
                  )}
                >
                  <CalendarClock className="size-3.5" />
                  {left < 0 ? `Venció el ${dateFormat.format(new Date(a.venceEn))}` : `Vence el ${dateFormat.format(new Date(a.venceEn))}`}
                </span>
              )}
            </div>
            <div className="space-y-2 p-5">
              {!a.datos ? (
                <p className="text-sm text-muted-foreground">No pudimos mostrar estos accesos. Escríbenos y te los reenviamos.</p>
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FIELDS.filter((f) => a.datos?.[f.key]).map((f) => (
                      <Field key={f.key} label={f.label} value={a.datos![f.key]!} secret={f.secret} />
                    ))}
                  </div>
                  {a.datos.enlace && (
                    <Button variant="outline" className="w-full rounded-xl" render={<a href={a.datos.enlace} target="_blank" rel="noreferrer" />} nativeButton={false}>
                      <ExternalLink className="size-4" />
                      Abrir enlace de acceso
                    </Button>
                  )}
                  {a.datos.notas && <p className="whitespace-pre-line rounded-xl bg-brand-mint px-3 py-2 text-sm">{a.datos.notas}</p>}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
