"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  ImageUp,
  KeyRound,
  Landmark,
  Loader2,
  Package,
  Send,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
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
import type { Payment, StatusOrden } from "@/types";

export function CopyButton({ value, label = "Copiar", className }: { value: string; label?: string; className?: string }) {
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
      className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-strong transition-colors hover:bg-brand/10", className)}
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

const TIMELINE = ["Pedido creado", "Pago enviado", "Pago confirmado", "Accesos entregados"];

/**
 * Último paso de la compra: qué pasó y qué sigue. Se actualiza en vivo cuando el admin confirma el pago
 * y cuando entrega los accesos.
 */
export function PaymentStatus({ payment, orderStatus }: { payment: Payment; orderStatus?: StatusOrden }) {
  const delivered = orderStatus === "ENVIADO" || orderStatus === "COMPLETADO";
  const reached = delivered ? 4 : payment.estado === "PAGADO" ? 3 : 2;
  const { contacto } = useSite().settings;

  const title = delivered ? "¡Tus accesos están listos!" : payment.estado === "PAGADO" ? "¡Pago confirmado!" : "¡Listo! Recibimos tu pago";
  const text = delivered
    ? "Ya puedes ver tus usuarios y contraseñas en tu cuenta. También te los enviamos por correo y WhatsApp."
    : payment.estado === "PAGADO"
      ? "Estamos preparando tus accesos. Te avisaremos aquí, por correo y por WhatsApp en cuanto estén listos."
      : `Estamos verificando tu comprobante${payment.referencia ? ` (operación ${payment.referencia})` : ""}. Normalmente lo confirmamos en pocos minutos. No necesitas escribirnos: esta página se actualiza sola.`;

  return (
    <div className="rounded-3xl border border-brand/40 bg-brand-mint p-6 md:p-8">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand/20">
          {reached >= 3 ? <CheckCircle2 className="size-9 text-brand-strong" /> : <Clock className="size-8 text-brand-strong" />}
        </span>
        <p className="mt-4 text-2xl font-extrabold tracking-tight">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>
      </div>

      <ol className="mx-auto mt-6 max-w-sm space-y-0">
        {TIMELINE.map((label, i) => {
          const done = i < reached;
          const active = i === reached;
          return (
            <li key={label} className="relative flex gap-3 pb-4 last:pb-0">
              {i < TIMELINE.length - 1 && <span className={cn("absolute top-7 left-3.5 h-[calc(100%-1.5rem)] w-px", done ? "bg-brand" : "bg-border")} />}
              <span
                className={cn(
                  "relative flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-brand text-brand-ink" : active ? "bg-background ring-2 ring-brand" : "bg-background text-muted-foreground ring-1 ring-border"
                )}
              >
                {done ? <Check className="size-4" /> : active ? <Loader2 className="size-3.5 animate-spin text-brand-strong" /> : i + 1}
              </span>
              <span className={cn("pt-1 text-sm", done ? "font-semibold" : active ? "font-semibold" : "text-muted-foreground")}>
                {label}
                {active && <span className="block text-xs font-normal text-muted-foreground">En curso…</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button className="h-11 rounded-xl" render={<Link href={delivered ? "/account?tab=accesos" : "/account"} />} nativeButton={false}>
          {delivered ? <KeyRound className="size-4" /> : <Package className="size-4" />}
          {delivered ? "Ver mis accesos" : "Ver mis pedidos"}
        </Button>
        <Button variant="outline" className="h-11 rounded-xl bg-background" render={<Link href="/products" />} nativeButton={false}>
          Seguir comprando
        </Button>
      </div>
      {contacto.horario && <p className="mt-4 text-center text-xs text-muted-foreground">Atención: {contacto.horario}</p>}
    </div>
  );
}

// ==================== Pago directo ====================

type Medio = "Yape" | "Plin" | "Transferencia";

const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD = 4.5 * 1024 * 1024;

/**
 * Las fotos del celular pesan varios MB (o vienen en HEIC): se reducen a JPEG antes de subirlas
 * para que el envío sea rápido con datos móviles y entre en el límite del servidor.
 */
async function prepareProof(file: File): Promise<File> {
  if (PROOF_TYPES.includes(file.type) && file.size <= 1.5 * 1024 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (blob) return new File([blob], "comprobante.jpg", { type: "image/jpeg" });
  } catch {
    // Si el navegador no puede leerla se intenta con el archivo original
  }
  return file;
}

async function downloadImage(url: string, name: string) {
  try {
    const blob = await fetch(url).then((r) => (r.ok ? r.blob() : Promise.reject()));
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href, download: name });
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

function StepCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-5 md:p-6">
      <h2 className="flex items-center gap-2.5 font-bold">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-ink text-xs text-white">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function HowTo({ steps }: { steps: React.ReactNode[] }) {
  return (
    <ol className="space-y-2 text-sm">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold text-brand-strong">{i + 1}</span>
          <span className="text-muted-foreground [&_b]:text-foreground">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function DirectPayment({ payment, numeroOrden, onUpdated }: { payment: Payment; numeroOrden: string; onUpdated: () => void }) {
  const { directo } = useSite().settings.pagos;
  const monto = Number(payment.monto);
  const montoText = formatPrice(monto);

  const medios: Medio[] = [
    ...(directo.yape || directo.qrUrl ? (["Yape"] as const) : []),
    ...(directo.plin ? (["Plin"] as const) : []),
    ...(directo.cuentas.length > 0 ? (["Transferencia"] as const) : []),
  ];
  const [medio, setMedio] = useState<Medio | null>(null);
  const selected = medio ?? medios[0] ?? null;

  const [referencia, setReferencia] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLDivElement>(null);

  // Libera la vista previa al salir de la página
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pickFile = async (next: File | null) => {
    if (!next) return;
    setError("");
    setPreparing(true);
    const ready = await prepareProof(next);
    setPreparing(false);
    if (ready.size > MAX_UPLOAD) return setError("La imagen es muy pesada. Toma una captura de pantalla de la constancia y súbela.");
    setFile(ready);
    setPreview(URL.createObjectURL(ready));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Sube la captura de tu pago para continuar.");
      proofRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError("");
    setSending(true);
    try {
      const form = new FormData();
      form.append("referencia", referencia.trim());
      if (selected) form.append("medio", selected);
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

  const titular = directo.titular ? <b>{directo.titular}</b> : null;
  const walletSteps = (app: "Yape" | "Plin", numero: string) => [
    app === "Yape" ? (
      <>Abre <b>Yape</b> y toca <b>Yapear</b>{directo.qrUrl ? <> o <b>Escanear QR</b></> : null}.</>
    ) : (
      <>Abre la app de tu banco (BBVA, Interbank, Scotiabank…) y entra a <b>Plin</b>.</>
    ),
    directo.qrUrl && app === "Yape" ? (
      <>Escanea el QR. Si estás en este mismo celular, toca <b>Descargar QR</b> y elígelo desde tu galería.{numero ? <> También puedes pegar el número <b>{numero}</b>.</> : null}</>
    ) : (
      <>Pega el número <b>{numero}</b> (tócalo arriba para copiarlo).</>
    ),
    <>
      Verifica que el nombre sea {titular ?? "el de la tienda"} y paga exactamente <b>{montoText}</b>.
    </>,
    <>
      En el mensaje escribe tu código <b>{numeroOrden}</b>.
    </>,
    <>Toma una captura de la constancia y súbela en el paso 3.</>,
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      {payment.estado === "RECHAZADO" && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <XCircle className="size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold">No pudimos confirmar tu pago</p>
            <p className="text-muted-foreground">{payment.motivoRechazo} Revisa los datos y vuelve a enviar tu comprobante.</p>
          </div>
        </div>
      )}

      <div className="grid gap-3 rounded-3xl bg-surface-ink p-5 text-white sm:grid-cols-2 md:p-6">
        <div>
          <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">Total a pagar</p>
          <p className="text-4xl font-black tracking-tight">{montoText}</p>
          <CopyButton value={monto.toFixed(2)} label="Copiar monto" className="mt-1 -ml-2 text-brand-bright hover:bg-white/10" />
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">Código de tu pedido</p>
          <p className="font-mono text-2xl font-bold">{numeroOrden}</p>
          <CopyButton value={numeroOrden} label="Copiar código" className="mt-1 -ml-2 text-brand-bright hover:bg-white/10 sm:-mr-2 sm:ml-0" />
          <p className="mt-1 text-xs text-white/60">Escríbelo en el mensaje o concepto del pago.</p>
        </div>
      </div>

      {medios.length === 0 ? (
        <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Estamos actualizando nuestros datos de pago. Escríbenos con el botón de ayuda y te los enviamos al momento.
        </p>
      ) : (
        <>
          <StepCard n={1} title="Elige cómo pagar">
            <div role="radiogroup" aria-label="Medio de pago" className={cn("grid gap-2", medios.length === 3 ? "grid-cols-3" : medios.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
              {medios.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={selected === m}
                  onClick={() => setMedio(m)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-sm font-bold transition-colors",
                    selected === m ? "border-brand bg-brand/10" : "border-transparent bg-muted hover:border-brand/40"
                  )}
                >
                  {m === "Transferencia" ? <Landmark className="size-5" /> : <Smartphone className="size-5" />}
                  {m}
                </button>
              ))}
            </div>
            {directo.instrucciones && <p className="mt-3 text-sm text-muted-foreground">{directo.instrucciones}</p>}
          </StepCard>

          <StepCard n={2} title={selected === "Transferencia" ? "Transfiere a nuestra cuenta" : `Paga con ${selected}`}>
            {selected === "Transferencia" ? (
              <div className="space-y-4">
                {directo.cuentas.map((c, i) => (
                  <div key={i} className="space-y-2 rounded-2xl border p-3">
                    <p className="text-sm font-bold">
                      {c.banco}
                      {c.titular && <span className="font-normal text-muted-foreground"> · {c.titular}</span>}
                    </p>
                    {c.numero && <Row label="N.º de cuenta (mismo banco)" value={c.numero} />}
                    {c.cci && <Row label="CCI (desde otro banco)" value={c.cci} />}
                  </div>
                ))}
                <HowTo
                  steps={[
                    <>Desde tu app del banco, transfiere a la cuenta (o al CCI si es otro banco).</>,
                    <>
                      Envía exactamente <b>{montoText}</b>.
                    </>,
                    <>
                      En el concepto o descripción escribe <b>{numeroOrden}</b>.
                    </>,
                    <>Toma una captura de la constancia y súbela en el paso 3.</>,
                  ]}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className={cn("grid gap-4", directo.qrUrl && selected === "Yape" && "sm:grid-cols-[auto_1fr] sm:items-start")}>
                  {directo.qrUrl && selected === "Yape" && (
                    <figure className="flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={assetUrl(directo.qrUrl)} alt="Código QR para pagar" className="size-48 rounded-2xl border bg-white object-contain p-2" />
                      <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => downloadImage(assetUrl(directo.qrUrl), `qr-${numeroOrden}.png`)}>
                        <Download className="size-3.5" />
                        Descargar QR
                      </Button>
                    </figure>
                  )}
                  <div className="space-y-2">
                    {selected === "Yape" && directo.yape && <Row label="Número Yape" value={directo.yape} />}
                    {selected === "Plin" && directo.plin && <Row label="Número Plin" value={directo.plin} />}
                    {directo.titular && <Row label="A nombre de" value={directo.titular} copy={false} />}
                    <Row label="Monto exacto" value={montoText} copy={false} />
                  </div>
                </div>
                <HowTo steps={walletSteps(selected === "Plin" ? "Plin" : "Yape", (selected === "Plin" ? directo.plin : directo.yape) || "")} />
              </div>
            )}
          </StepCard>
        </>
      )}

      <StepCard n={medios.length === 0 ? 1 : 3} title="Envía tu comprobante">
        <div ref={proofRef} className="space-y-4">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
          <input ref={galleryRef} id="comprobante" type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />

          {preview ? (
            <div className="flex items-center gap-3 rounded-2xl border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Vista previa del comprobante" className="size-20 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-brand-strong">
                  <Check className="size-4" /> Captura lista
                </p>
                <button type="button" onClick={() => galleryRef.current?.click()} className="block text-xs text-muted-foreground underline underline-offset-2">
                  Cambiar imagen
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={preparing}
                className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-3 py-5 text-sm font-semibold transition-colors hover:border-brand"
              >
                {preparing ? <Loader2 className="size-6 animate-spin" /> : <ImageUp className="size-6 text-brand-strong" />}
                Subir captura
                <span className="text-[11px] font-normal text-muted-foreground">Desde tu galería</span>
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={preparing}
                className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-3 py-5 text-sm font-semibold transition-colors hover:border-brand"
              >
                <Camera className="size-6 text-brand-strong" />
                Tomar foto
                <span className="text-[11px] font-normal text-muted-foreground">Con la cámara</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="referencia">
              N.º de operación <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="referencia"
              inputMode="numeric"
              placeholder="Ej. 01234567"
              className="h-11 rounded-xl"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">Si la captura se ve bien, no hace falta: lo leemos de ahí.</p>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold" disabled={sending || preparing}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Ya pagué · Enviar comprobante
          </Button>
          <p className="inline-flex w-full items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" /> Tu captura solo la ve nuestro equipo para confirmar el pago.
          </p>
        </div>
      </StepCard>
    </form>
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
