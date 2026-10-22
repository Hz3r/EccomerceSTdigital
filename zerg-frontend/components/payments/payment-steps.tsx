"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Clock, Copy, ExternalLink, ImageUp, Loader2, QrCode, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useSite } from "@/hooks/useSiteSettings";
import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/auth-redirect";
import { formatPrice } from "@/lib/catalog";
import { assetUrl } from "@/lib/site-settings";
import { cn } from "@/lib/utils";
import type { Payment } from "@/types";

export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand/10"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copiado" : label}
    </button>
  );
}

function Row({ label, value, copy = true }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className={cn("truncate text-sm font-semibold", copy && "font-mono")}>{value}</p>
      </div>
      {copy && <CopyButton value={value} />}
    </div>
  );
}

// Estados que se muestran igual para todos los métodos.
export function PaymentStatus({ payment }: { payment: Payment }) {
  if (payment.estado === "PAGADO") {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-brand/40 bg-brand-mint p-8 text-center">
        <CheckCircle2 className="size-12 text-brand-strong" />
        <p className="mt-4 text-xl font-extrabold">¡Pago confirmado!</p>
        <p className="mt-1 text-sm text-muted-foreground">Estamos preparando tus accesos. Te avisaremos por aquí, tu correo y WhatsApp.</p>
      </div>
    );
  }
  if (payment.estado === "EN_REVISION") {
    return (
      <div className="flex flex-col items-center rounded-3xl border p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-yellow/20">
          <Clock className="size-7" />
        </span>
        <p className="mt-4 text-xl font-extrabold">Estamos verificando tu pago</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Recibimos tu comprobante{payment.referencia ? ` (operación ${payment.referencia})` : ""}. Normalmente lo confirmamos en pocos minutos y te avisamos.
        </p>
      </div>
    );
  }
  return null;
}

// ==================== Pago directo ====================

export function DirectPayment({ payment, onUpdated }: { payment: Payment; onUpdated: () => void }) {
  const { directo } = useSite().settings.pagos;
  const [referencia, setReferencia] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const monto = Number(payment.monto);

  // Libera la vista previa al salir de la página
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pickFile = (next: File | null) => {
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referencia.trim()) return setError("Escribe el número de operación.");
    if (!file) return setError("Sube la captura de tu pago.");
    setError("");
    setSending(true);
    try {
      const form = new FormData();
      form.append("referencia", referencia.trim());
      form.append("file", file);
      await api.post(`/payments/${payment.id}/proof`, form, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("¡Comprobante enviado!", "Lo revisamos y te avisamos en cuanto se confirme.");
      onUpdated();
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos enviar tu comprobante. Intenta de nuevo."));
    } finally {
      setSending(false);
    }
  };

  const hasWallet = directo.yape || directo.plin || directo.qrUrl;

  return (
    <div className="space-y-5">
      {payment.estado === "RECHAZADO" && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <XCircle className="size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold">No pudimos confirmar tu pago</p>
            <p className="text-muted-foreground">{payment.motivoRechazo} Revisa los datos y vuelve a enviar tu comprobante.</p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Monto a pagar</p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-4xl font-black tracking-tight">{formatPrice(monto)}</p>
          <CopyButton value={monto.toFixed(2)} label="Copiar monto" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{directo.instrucciones}</p>

        {hasWallet && (
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <p className="text-sm font-bold">Yape o Plin</p>
              {directo.titular && <Row label="Titular" value={directo.titular} copy={false} />}
              {directo.yape && <Row label="Yape" value={directo.yape} />}
              {directo.plin && <Row label="Plin" value={directo.plin} />}
            </div>
            {directo.qrUrl && (
              <figure className="flex flex-col items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(directo.qrUrl)} alt="Código QR para pagar" className="size-40 rounded-xl border bg-white object-contain p-2" />
                <figcaption className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <QrCode className="size-3.5" /> Escanéalo desde tu app
                </figcaption>
              </figure>
            )}
          </div>
        )}

        {directo.cuentas.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-sm font-bold">Transferencia bancaria</p>
            {directo.cuentas.map((c, i) => (
              <div key={i} className="space-y-2 rounded-2xl border p-3">
                <p className="text-sm font-semibold">
                  {c.banco}
                  {c.titular && <span className="font-normal text-muted-foreground"> · {c.titular}</span>}
                </p>
                {c.numero && <Row label="Cuenta" value={c.numero} />}
                {c.cci && <Row label="CCI" value={c.cci} />}
              </div>
            ))}
          </div>
        )}

        {!hasWallet && directo.cuentas.length === 0 && (
          <p className="mt-5 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
            Escríbenos por el chat o WhatsApp para recibir los datos de pago.
          </p>
        )}
      </div>

      <form onSubmit={submit} className="rounded-3xl border bg-card p-6">
        <p className="font-bold">¿Ya pagaste? Envíanos tu comprobante</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="referencia">Número de operación</Label>
            <Input
              id="referencia"
              inputMode="numeric"
              placeholder="Ej. 01234567"
              className="h-11 rounded-xl"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">Aparece en la constancia de Yape, Plin o tu banco.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comprobante">Captura del pago</Label>
            <input
              ref={fileRef}
              id="comprobante"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex h-28 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-brand hover:text-foreground",
                preview && "border-solid p-1"
              )}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Vista previa del comprobante" className="h-full w-full rounded-lg object-contain" />
              ) : (
                <>
                  <ImageUp className="size-6" />
                  Toca para subir tu captura
                </>
              )}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="mt-5 h-12 w-full rounded-xl text-base font-semibold" disabled={sending}>
          {sending && <Loader2 className="size-4 animate-spin" />}
          Enviar comprobante
        </Button>
      </form>
    </div>
  );
}

// ==================== Izipay (tarjeta) ====================

interface KRClient {
  setFormConfig: (config: Record<string, unknown>) => Promise<unknown>;
  renderElements: (selector: string) => Promise<unknown>;
  onSubmit: (cb: (event: { clientAnswer: unknown; rawClientAnswer?: string; hash: string }) => boolean | Promise<boolean>) => void;
  removeForms?: () => Promise<unknown>;
}

declare global {
  interface Window {
    KR?: KRClient;
  }
}

function loadIzipayScript(src: string, publicKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.KR) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.setAttribute("kr-public-key", publicKey);
    script.setAttribute("kr-language", "es-ES");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Izipay"));
    document.head.appendChild(script);
  });
}

export function IzipayPayment({ payment, onUpdated }: { payment: Payment; onUpdated: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");

  const start = async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await api.post<{ data: { formToken: string; publicKey: string; scriptUrl: string } }>(`/payments/${payment.id}/izipay`);
      const { formToken, publicKey, scriptUrl } = res.data.data;
      await loadIzipayScript(scriptUrl, publicKey);
      const KR = window.KR!;
      await KR.setFormConfig({ formToken, "kr-language": "es-ES" });
      await KR.renderElements("#izipay-form");
      KR.onSubmit(async (event) => {
        try {
          await api.post(`/payments/${payment.id}/izipay/confirm`, {
            krAnswer: event.rawClientAnswer ?? JSON.stringify(event.clientAnswer),
            krHash: event.hash,
          });
        } finally {
          onUpdated();
        }
        return false;
      });
      setStatus("ready");
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos abrir el pago con tarjeta."));
      setStatus("error");
    }
  };

  return (
    <div className="rounded-3xl border bg-card p-6">
      <p className="text-sm text-muted-foreground">Monto a pagar</p>
      <p className="text-4xl font-black tracking-tight">{formatPrice(Number(payment.monto))}</p>
      <p className="mt-3 text-sm text-muted-foreground">El pago se procesa de forma segura en el formulario de Izipay. Tus datos de tarjeta no pasan por nuestra tienda.</p>
      <div id="izipay-form" className={cn("mt-5", status !== "ready" && "hidden")}>
        <div className="kr-embedded" />
      </div>
      {status !== "ready" && (
        <Button className="mt-5 h-12 w-full rounded-xl text-base font-semibold" onClick={start} disabled={status === "loading"}>
          {status === "loading" && <Loader2 className="size-4 animate-spin" />}
          Pagar con tarjeta
        </Button>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}

// ==================== Binance Pay ====================

export function BinancePayment({ payment }: { payment: Payment }) {
  const [order, setOrder] = useState<{ checkoutUrl: string; qrcodeLink: string | null; montoUsdt: number; tipoCambio: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post<{ data: typeof order }>(`/payments/${payment.id}/binance`);
      setOrder(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos crear el pago con Binance Pay."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border bg-card p-6">
      <p className="text-sm text-muted-foreground">Monto a pagar</p>
      <p className="text-4xl font-black tracking-tight">{formatPrice(Number(payment.monto))}</p>
      {!order ? (
        <>
          <p className="mt-3 text-sm text-muted-foreground">Pagas en USDT desde tu app de Binance. Al confirmar verás el QR y el monto exacto.</p>
          <Button className="mt-5 h-12 w-full rounded-xl text-base font-semibold" onClick={start} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Pagar con Binance Pay
          </Button>
        </>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-4 text-center">
          <p className="text-sm">
            Paga <b className="text-lg">{order.montoUsdt.toFixed(2)} USDT</b>{" "}
            <span className="text-muted-foreground">(1 USDT = {formatPrice(order.tipoCambio)})</span>
          </p>
          {order.qrcodeLink && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.qrcodeLink} alt="QR de Binance Pay" className="size-48 rounded-xl border bg-white p-2" />
          )}
          <Button className="rounded-xl" render={<a href={order.checkoutUrl} target="_blank" rel="noreferrer" />} nativeButton={false}>
            <ExternalLink className="size-4" />
            Abrir Binance Pay
          </Button>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Esperando la confirmación de Binance…
          </p>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
