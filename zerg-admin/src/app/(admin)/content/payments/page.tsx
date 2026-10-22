"use client";

import * as React from "react";
import { CheckCircle2, CircleDashed, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageField } from "@/components/image-field";
import { Field, PageIntro, SaveBar, Section, SettingsState, SetupBanner, TextField, Toggle } from "@/components/cms/form";
import { ListControls, moveItem, removeItem, replaceItem } from "@/components/cms/list-controls";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import api from "@/lib/axios";
import type { CuentaBancaria, PaymentMethodOption } from "@/types";

const KEYS = ["pagos"] as const;
const MAX_CUENTAS = 6;

// Qué hace falta para activar cada pasarela (las credenciales van en zerg-backend/.env, nunca en el panel).
const GATEWAYS = [
  {
    metodo: "IZIPAY",
    title: "Tarjetas con Izipay",
    steps: [
      "Afilia tu negocio en izipay.pe y entra al Back Office Vendedor.",
      "En Configuración → Tienda → Claves de API REST copia usuario, contraseña, clave pública y clave HMAC-SHA-256.",
      "Pégalas en zerg-backend/.env como IZIPAY_USERNAME, IZIPAY_PASSWORD, IZIPAY_PUBLIC_KEY e IZIPAY_HMAC_KEY.",
      "Registra la URL de notificación (IPN): <URL pública del backend>/api/payments/webhooks/izipay. Reinicia el backend.",
    ],
  },
  {
    metodo: "BINANCE_PAY",
    title: "Cripto con Binance Pay",
    steps: [
      "Crea tu cuenta de comercio en merchant.binance.com (requiere verificación del negocio).",
      "En Developers genera una API Key y su Secret.",
      "Pégalas en zerg-backend/.env como BINANCE_PAY_API_KEY y BINANCE_PAY_SECRET, y define BACKEND_PUBLIC_URL para el webhook.",
      "Ajusta abajo el tipo de cambio (soles por USDT). Reinicia el backend.",
    ],
  },
] as const;

export default function PaymentsContentPage() {
  const { draft, status, error, savedAt, setupMessage, loadError, update, save, discard, isDirty } = useSiteSettings();
  const [methods, setMethods] = React.useState<PaymentMethodOption[]>([]);

  React.useEffect(() => {
    api
      .get<{ data: PaymentMethodOption[] }>("/payments/methods")
      .then((res) => setMethods(res.data.data))
      .catch(() => {});
  }, []);

  if (!draft) return <SettingsState status={status === "error" ? "error" : "loading"} reason={loadError} />;
  const pagos = draft.pagos;
  const directo = pagos.directo;
  const setDirecto = (patch: Partial<typeof directo>) => update("pagos", { ...pagos, directo: { ...directo, ...patch } });
  const cuentas = directo.cuentas;
  const setCuenta = (i: number, patch: Partial<CuentaBancaria>) => setDirecto({ cuentas: replaceItem(cuentas, i, patch) });

  return (
    <div className="space-y-6">
      <PageIntro
        title="Pagos"
        description="Cómo te pagan tus clientes. El pago directo funciona ya; Izipay y Binance Pay se activan solos al cargar sus credenciales en el backend."
        storePath="/checkout"
      />
      <SetupBanner message={setupMessage} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Section
          title="Pago directo (Yape, Plin o transferencia)"
          description="El cliente ve estos datos al pagar, sube su captura y tú confirmas el pago desde Órdenes."
        >
          <Toggle
            label="Aceptar pago directo"
            hint="Si lo desactivas, los clientes solo podrán pagar con las pasarelas activas."
            checked={directo.activo}
            onChange={(activo) => setDirecto({ activo })}
          />
          <TextField id="pago-titular" label="Titular" hint="Nombre que verá el cliente al pagar." value={directo.titular} onChange={(titular) => setDirecto({ titular })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="pago-yape" label="Número de Yape" placeholder="999 999 999" value={directo.yape} onChange={(yape) => setDirecto({ yape })} />
            <TextField id="pago-plin" label="Número de Plin" placeholder="999 999 999" value={directo.plin} onChange={(plin) => setDirecto({ plin })} />
          </div>
          <Field label="QR de Yape o Plin" hint="Descárgalo desde tu app (Yape → Mi QR) y súbelo aquí.">
            <ImageField value={directo.qrUrl} onChange={(qrUrl) => setDirecto({ qrUrl })} folder="branding" />
          </Field>
          <TextField
            id="pago-instrucciones"
            label="Instrucciones"
            multiline
            value={directo.instrucciones}
            onChange={(instrucciones) => setDirecto({ instrucciones })}
          />

          <Field label="Cuentas bancarias" hint="Para transferencias. Puedes dejarlo vacío si solo aceptas Yape y Plin.">
            <div className="space-y-3">
              {cuentas.map((c, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <Input value={c.banco} placeholder="Banco (ej. BCP)" aria-label="Banco" onChange={(e) => setCuenta(i, { banco: e.target.value })} className="h-8 font-semibold" />
                    <ListControls
                      index={i}
                      length={cuentas.length}
                      label={c.banco || "cuenta"}
                      onMove={(dir) => setDirecto({ cuentas: moveItem(cuentas, i, dir) })}
                      onRemove={() => setDirecto({ cuentas: removeItem(cuentas, i) })}
                    />
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <Input value={c.titular} placeholder="Titular" aria-label="Titular" onChange={(e) => setCuenta(i, { titular: e.target.value })} className="h-8" />
                    <Input value={c.numero} placeholder="N.º de cuenta" aria-label="Número de cuenta" onChange={(e) => setCuenta(i, { numero: e.target.value })} className="h-8 font-mono" />
                    <Input value={c.cci} placeholder="CCI" aria-label="CCI" onChange={(e) => setCuenta(i, { cci: e.target.value })} className="h-8 font-mono" />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={cuentas.length >= MAX_CUENTAS}
                onClick={() => setDirecto({ cuentas: [...cuentas, { banco: "", titular: directo.titular, numero: "", cci: "" }] })}
              >
                <Plus className="size-3.5" />
                Agregar cuenta
              </Button>
            </div>
          </Field>
        </Section>

        <div className="space-y-6">
          <Section title="Pasarelas" description="Se activan con sus credenciales en el backend. Mientras tanto la tienda las muestra como “Próximamente”.">
            {GATEWAYS.map((g) => {
              const active = methods.find((m) => m.metodo === g.metodo)?.disponible;
              return (
                <details key={g.metodo} className="group rounded-xl border p-3" open={!active}>
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {active ? <CheckCircle2 className="size-4 text-brand-strong" /> : <CircleDashed className="size-4 text-muted-foreground" />}
                    {g.title}
                    <span className={active ? "ml-auto text-xs text-brand-strong" : "ml-auto text-xs text-muted-foreground"}>
                      {active ? "Activa" : "Sin configurar"}
                    </span>
                  </summary>
                  <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs text-muted-foreground">
                    {g.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </details>
              );
            })}
          </Section>

          <Section title="Tipo de cambio para cripto" description="Los precios están en soles; Binance Pay cobra en USDT.">
            <Field label="Soles por 1 USDT" htmlFor="tipo-cambio" hint={`Ejemplo: un pedido de S/ 37.50 se cobra ${(37.5 / (pagos.tipoCambioUsdt || 1)).toFixed(2)} USDT.`}>
              <Input
                id="tipo-cambio"
                type="number"
                min={0.01}
                step={0.01}
                value={pagos.tipoCambioUsdt}
                onChange={(e) => update("pagos", { ...pagos, tipoCambioUsdt: Number(e.target.value) })}
                className="max-w-40"
              />
            </Field>
          </Section>
        </div>
      </div>

      <SaveBar dirty={isDirty([...KEYS])} saving={status === "saving"} savedAt={savedAt} error={error} onSave={() => save([...KEYS])} onDiscard={discard} />
    </div>
  );
}
