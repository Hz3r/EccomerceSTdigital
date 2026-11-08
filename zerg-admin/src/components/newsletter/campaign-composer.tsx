"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Loader2, MailCheck, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { useLiveVersion } from "@/lib/live"
import api from "@/lib/axios"
import { STORE_URL } from "@/lib/format"
import { cn } from "@/lib/utils"

interface Campaign {
  id: string
  asunto: string
  estado: "ENVIANDO" | "ENVIADA" | "CON_ERRORES" | "INTERRUMPIDA"
  total: number
  enviados: number
  fallidos: number
  creadoEn: string
  terminadoEn: string | null
}

interface CampaignsData {
  campaigns: Campaign[]
  enviando: boolean
  correoConfigurado: boolean
}

const apiError = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback

const fecha = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

const ESTADOS: Record<Campaign["estado"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ENVIANDO: { label: "Enviando…", variant: "outline" },
  ENVIADA: { label: "Enviada", variant: "default" },
  CON_ERRORES: { label: "Con errores", variant: "destructive" },
  INTERRUMPIDA: { label: "Interrumpida", variant: "secondary" },
}

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

/** Escribir y enviar el boletín a los suscriptores activos, con vista previa, prueba e historial. */
export function CampaignComposer({ activos }: { activos: number }) {
  const { user } = useAuth()
  const [asunto, setAsunto] = React.useState("")
  const [mensaje, setMensaje] = React.useState("")
  const [botonTexto, setBotonTexto] = React.useState("Ver ofertas")
  const [botonUrl, setBotonUrl] = React.useState(`${STORE_URL}/products?ofertas=1`)
  const [testTo, setTestTo] = React.useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = React.useState("")
  const [previewError, setPreviewError] = React.useState("")
  const [busy, setBusy] = React.useState<"test" | "send" | null>(null)
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null)
  const [data, setData] = React.useState<CampaignsData | null>(null)

  const body = React.useMemo(() => ({ asunto, mensaje, botonTexto, botonUrl }), [asunto, mensaje, botonTexto, botonUrl])
  const ready = asunto.trim() !== "" && mensaje.trim() !== ""

  // Historial: en vivo con los cambios del backend y, mientras se envía, cada pocos segundos.
  const liveVersion = useLiveVersion("subscribers")
  const [tick, setTick] = React.useState(0)
  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: CampaignsData }>("/newsletter/campaigns")
      .then((res) => {
        if (!cancelled) setData(res.data.data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [liveVersion, tick])
  React.useEffect(() => {
    if (!data?.enviando) return
    const id = setInterval(() => setTick((t) => t + 1), 3000)
    return () => clearInterval(id)
  }, [data?.enviando])

  // Vista previa generada por el backend (la misma plantilla que se envía), con una pequeña espera al escribir.
  React.useEffect(() => {
    if (!ready) return
    const id = setTimeout(() => {
      api
        .post<{ data: { html: string } }>("/newsletter/campaigns/preview", body)
        .then((res) => {
          setPreviewHtml(res.data.data.html)
          setPreviewError("")
        })
        .catch((err) => setPreviewError(apiError(err, "No se pudo generar la vista previa")))
    }, 500)
    return () => clearTimeout(id)
  }, [body, ready])

  const sendTest = async () => {
    setBusy("test")
    setNotice(null)
    try {
      const res = await api.post<{ message: string }>("/newsletter/campaigns/test", { ...body, to: testTo ?? user?.email ?? "" })
      setNotice({ ok: true, text: `${res.data.message}. Revisa también la carpeta de spam.` })
    } catch (err) {
      setNotice({ ok: false, text: apiError(err, "No se pudo enviar la prueba") })
    } finally {
      setBusy(null)
    }
  }

  const sendAll = async () => {
    if (!window.confirm(`¿Enviar "${asunto.trim()}" a ${activos} suscriptor${activos === 1 ? "" : "es"}? No se puede deshacer.`)) return
    setBusy("send")
    setNotice(null)
    try {
      await api.post("/newsletter/campaigns", body)
      setNotice({ ok: true, text: "Envío iniciado. Puedes seguir el progreso en el historial; no hace falta dejar esta página abierta." })
      setAsunto("")
      setMensaje("")
      setPreviewHtml("")
      setTick((t) => t + 1)
    } catch (err) {
      setNotice({ ok: false, text: apiError(err, "No se pudo iniciar el envío") })
    } finally {
      setBusy(null)
    }
  }

  const noEmail = data && !data.correoConfigurado

  return (
    <div className="space-y-6">
      {noEmail && (
        <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">Falta configurar el envío de correos</p>
            <p className="mt-1 text-muted-foreground">
              Agrega <code className="rounded bg-muted px-1">RESEND_API_KEY</code> y <code className="rounded bg-muted px-1">EMAIL_FROM</code> en las variables del
              backend (en Railway: tu servicio → Variables) y vuelve a desplegar. Es la misma cuenta de Resend que envía los accesos de los pedidos.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-xl border p-5">
          <div className="space-y-2">
            <Label htmlFor="camp-asunto">Asunto</Label>
            <Input id="camp-asunto" maxLength={150} placeholder="Ej. Esta semana: Netflix a S/18" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="camp-mensaje">Mensaje</Label>
            <textarea
              id="camp-mensaje"
              rows={9}
              maxLength={10000}
              placeholder={"Cuéntales tus ofertas, combos o servicios nuevos.\n\nDeja una línea en blanco para separar párrafos. Los enlaces (https://…) se vuelven clicables."}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className={textareaClass}
            />
            <p className="text-xs text-muted-foreground">El correo empieza con “Hola [nombre],” y termina con el enlace para darse de baja; no hace falta escribirlos.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_1.6fr]">
            <div className="space-y-2">
              <Label htmlFor="camp-boton">Botón (opcional)</Label>
              <Input id="camp-boton" maxLength={60} placeholder="Ver ofertas" value={botonTexto} onChange={(e) => setBotonTexto(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-url">Enlace del botón</Label>
              <Input id="camp-url" maxLength={500} placeholder="https://…" value={botonUrl} onChange={(e) => setBotonUrl(e.target.value)} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Deja el enlace vacío para no mostrar botón.</p>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="camp-test">Enviarme una prueba a</Label>
            <div className="flex gap-2">
              <Input id="camp-test" type="email" value={testTo ?? user?.email ?? ""} onChange={(e) => setTestTo(e.target.value)} />
              <Button type="button" variant="outline" onClick={sendTest} disabled={!ready || busy !== null || !!noEmail}>
                {busy === "test" ? <Loader2 className="size-3.5 animate-spin" /> : <MailCheck className="size-3.5" />}
                Enviar prueba
              </Button>
            </div>
          </div>

          <Button type="button" className="w-full" onClick={sendAll} disabled={!ready || busy !== null || activos === 0 || !!noEmail || !!data?.enviando}>
            {busy === "send" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {data?.enviando ? "Hay un envío en curso…" : `Enviar a ${activos} suscriptor${activos === 1 ? "" : "es"}`}
          </Button>
          {activos === 0 && <p className="text-center text-xs text-muted-foreground">Aún no hay suscriptores activos.</p>}
          {notice && (
            <p
              role="status"
              className={cn(
                "flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
                notice.ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              )}
            >
              {notice.ok ? <CheckCircle2 className="mt-px size-3.5 shrink-0" /> : <AlertTriangle className="mt-px size-3.5 shrink-0" />}
              {notice.text}
            </p>
          )}
        </div>

        <div className="flex flex-col rounded-xl border">
          <p className="border-b px-4 py-2.5 text-xs font-semibold text-muted-foreground">Vista previa</p>
          {ready && previewHtml ? (
            <iframe title="Vista previa del correo" sandbox="" srcDoc={previewHtml} className="min-h-[32rem] w-full flex-1 rounded-b-xl bg-white" />
          ) : (
            <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              {ready && previewError ? previewError : "Escribe el asunto y el mensaje para ver cómo quedará el correo."}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border">
        <p className="border-b px-4 py-2.5 text-sm font-semibold">Historial de envíos</p>
        {!data || data.campaigns.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Todavía no enviaste ningún boletín.</p>
        ) : (
          <ul className="divide-y">
            {data.campaigns.map((c) => {
              const estado = ESTADOS[c.estado] ?? ESTADOS.INTERRUMPIDA
              const pct = c.total ? Math.round(((c.enviados + c.fallidos) / c.total) * 100) : 0
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.asunto}</p>
                    <p className="text-xs text-muted-foreground">{fecha.format(new Date(c.creadoEn))}</p>
                  </div>
                  <div className="text-right text-xs tabular-nums text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">{c.enviados}</span> de {c.total} enviados
                      {c.fallidos > 0 && <span className="text-destructive"> · {c.fallidos} fallidos</span>}
                    </p>
                    {c.estado === "ENVIANDO" && (
                      <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <Badge variant={estado.variant}>{estado.label}</Badge>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
