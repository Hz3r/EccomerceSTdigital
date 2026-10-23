"use client"

import * as React from "react"
import { CheckIcon, Eye, Globe, KeyRound, Loader2, Mail, MessageCircle, Save, Send, TrashIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLiveVersion } from "@/lib/live"
import api from "@/lib/axios"
import { cn } from "@/lib/utils"

type Campo = "usuario" | "contrasena" | "perfil" | "pin" | "enlace" | "notas"
type Datos = Partial<Record<Campo, string>>
type Canal = "WEB" | "EMAIL" | "WHATSAPP"

interface Credential {
  id: string
  datos: Datos | null
  venceEn: string | null
  publicadoEn: string | null
  enviadoCorreoEn: string | null
  enviadoWhatsappEn: string | null
  vistoEn: string | null
}

interface DeliveryData {
  items: { id: string; cantidad: number; producto: string; plan: string; duracion: string; credential: Credential | null }[]
  canales: Record<Canal, { disponible: boolean; motivo: string | null }>
  destino: { email: string; telefono: string | null }
}

interface Draft {
  datos: Datos
  venceEn: string
}

const FIELDS: { key: Exclude<Campo, "notas">; label: string; placeholder: string }[] = [
  { key: "usuario", label: "Usuario / correo", placeholder: "cuenta@correo.com" },
  { key: "contrasena", label: "Contraseña", placeholder: "••••••••" },
  { key: "perfil", label: "Perfil", placeholder: "Perfil 3" },
  { key: "pin", label: "PIN", placeholder: "1234" },
  { key: "enlace", label: "Enlace", placeholder: "https://… (activación o invitación)" },
]

const CANALES: { key: Canal; label: string; icon: typeof Globe }[] = [
  { key: "WEB", label: "Mis accesos (web)", icon: Globe },
  { key: "EMAIL", label: "Correo", icon: Mail },
  { key: "WHATSAPP", label: "WhatsApp Business", icon: MessageCircle },
]

const area =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
const shortDate = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" })

const omit = <T,>(record: Record<string, T>, key: string) => Object.fromEntries(Object.entries(record).filter(([k]) => k !== key))
const toDraft = (c: Credential | null): Draft => ({ datos: { ...(c?.datos ?? {}) }, venceEn: c?.venceEn?.slice(0, 10) ?? "" })
const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback

function Sent({ icon: Icon, label, at }: { icon: typeof Globe; label: string; at: string | null }) {
  if (!at) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-brand-strong dark:text-brand-bright" title={shortDate.format(new Date(at))}>
      <Icon className="size-3" />
      {label}
    </span>
  )
}

/** Carga los accesos de cada producto del pedido y los envía por la web, correo y/o WhatsApp Business. */
export function CredentialDelivery({ orderId }: { orderId: string }) {
  const [data, setData] = React.useState<DeliveryData | null>(null)
  const [drafts, setDrafts] = React.useState<Record<string, Draft>>({})
  const [saving, setSaving] = React.useState<string | null>(null)
  const [itemError, setItemError] = React.useState<Record<string, string>>({})
  const [canales, setCanales] = React.useState<Canal[]>(["WEB"])
  const [sending, setSending] = React.useState(false)
  const [results, setResults] = React.useState<{ canal: Canal; ok: boolean; mensaje: string }[] | null>(null)
  const liveVersion = useLiveVersion("orders")

  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: DeliveryData }>(`/credentials/admin/orders/${orderId}`)
      .then((res) => {
        if (cancelled) return
        setData(res.data.data)
        // Los canales disponibles quedan marcados por defecto (la primera vez)
        setCanales((prev) => (prev.length === 1 && prev[0] === "WEB" ? CANALES.filter((c) => res.data.data.canales[c.key].disponible).map((c) => c.key) : prev))
      })
      .catch(() => !cancelled && setData(null))
    return () => {
      cancelled = true
    }
  }, [orderId, liveVersion])

  if (!data) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const draftOf = (itemId: string, c: Credential | null) => drafts[itemId] ?? toDraft(c)
  const edit = (itemId: string, c: Credential | null, patch: Partial<Draft> & { campo?: [Campo, string] }) => {
    const current = draftOf(itemId, c)
    const datos = patch.campo ? { ...current.datos, [patch.campo[0]]: patch.campo[1] } : current.datos
    setDrafts((prev) => ({ ...prev, [itemId]: { datos, venceEn: patch.venceEn ?? current.venceEn } }))
  }

  const save = async (itemId: string, c: Credential | null) => {
    const draft = draftOf(itemId, c)
    setSaving(itemId)
    setItemError((prev) => ({ ...prev, [itemId]: "" }))
    try {
      const res = await api.put<{ data: Credential }>(`/credentials/admin/items/${itemId}`, { datos: draft.datos, venceEn: draft.venceEn || null })
      setData((prev) => prev && { ...prev, items: prev.items.map((i) => (i.id === itemId ? { ...i, credential: res.data.data } : i)) })
      setDrafts((prev) => omit(prev, itemId))
    } catch (err) {
      setItemError((prev) => ({ ...prev, [itemId]: errorMessage(err, "No se pudo guardar") }))
    } finally {
      setSaving(null)
    }
  }

  const remove = async (itemId: string) => {
    if (!window.confirm("¿Borrar los accesos guardados de este producto?")) return
    await api.delete(`/credentials/admin/items/${itemId}`).catch(() => {})
    setData((prev) => prev && { ...prev, items: prev.items.map((i) => (i.id === itemId ? { ...i, credential: null } : i)) })
    setDrafts((prev) => omit(prev, itemId))
  }

  const send = async () => {
    setSending(true)
    setResults(null)
    try {
      const res = await api.post<{ data: { results: { canal: Canal; ok: boolean; mensaje: string }[] } }>(`/credentials/admin/orders/${orderId}/send`, {
        canales: canales.filter((k) => data.canales[k].disponible),
      })
      setResults(res.data.data.results)
    } catch (err) {
      setResults([{ canal: canales[0] ?? "WEB", ok: false, mensaje: errorMessage(err, "No se pudo enviar") }])
    } finally {
      setSending(false)
    }
  }

  const saved = data.items.filter((i) => i.credential).length
  const unsaved = Object.keys(drafts).length > 0

  return (
    <section className="space-y-3 rounded-xl border p-3">
      <div className="flex items-start gap-2">
        <KeyRound className="mt-0.5 size-4 text-brand-strong dark:text-brand-bright" />
        <div>
          <h3 className="text-sm font-bold">Accesos del cliente</h3>
          <p className="text-xs text-muted-foreground">Se guardan cifrados. Llena solo lo que aplique a cada servicio.</p>
        </div>
      </div>

      {data.items.map((item) => {
        const c = item.credential
        const draft = draftOf(item.id, c)
        const dirty = Boolean(drafts[item.id])
        return (
          <div key={item.id} className="space-y-2 rounded-lg bg-muted/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {item.producto} <span className="font-normal text-muted-foreground">· {item.plan}{item.cantidad > 1 ? ` ×${item.cantidad}` : ""}</span>
              </p>
              <span className="flex flex-wrap gap-1">
                {c && <Sent icon={Globe} label="Web" at={c.publicadoEn} />}
                {c && <Sent icon={Mail} label="Correo" at={c.enviadoCorreoEn} />}
                {c && <Sent icon={MessageCircle} label="WhatsApp" at={c.enviadoWhatsappEn} />}
                {c && <Sent icon={Eye} label="Visto" at={c.vistoEn} />}
              </span>
            </div>
            {c && !c.datos && <p className="text-xs text-destructive">No se pudieron leer los datos guardados (¿cambió CREDENTIALS_KEY?). Vuelve a escribirlos.</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <label key={f.key} className={cn("space-y-1", f.key === "enlace" && "sm:col-span-2")}>
                  <span className="text-[11px] font-medium text-muted-foreground">{f.label}</span>
                  <Input
                    value={draft.datos[f.key] ?? ""}
                    placeholder={f.placeholder}
                    maxLength={300}
                    autoComplete="off"
                    onChange={(e) => edit(item.id, c, { campo: [f.key, e.target.value] })}
                    className="bg-background font-mono text-xs"
                  />
                </label>
              ))}
              <label className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Vence (opcional)</span>
                <Input type="date" value={draft.venceEn} onChange={(e) => edit(item.id, c, { venceEn: e.target.value })} className="bg-background text-xs" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-[11px] font-medium text-muted-foreground">Indicaciones para el cliente</span>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={draft.datos.notas ?? ""}
                  placeholder="Ej.: No cambies la contraseña. Usa solo tu perfil."
                  onChange={(e) => edit(item.id, c, { campo: ["notas", e.target.value] })}
                  className={cn(area, "bg-background")}
                />
              </label>
            </div>
            {itemError[item.id] && <p className="text-xs text-destructive">{itemError[item.id]}</p>}
            <div className="flex justify-end gap-2">
              {c && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(item.id)}>
                  <TrashIcon className="size-3.5" />
                  Borrar
                </Button>
              )}
              <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || saving === item.id} onClick={() => save(item.id, c)}>
                {saving === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {c ? "Guardar cambios" : "Guardar"}
              </Button>
            </div>
          </div>
        )
      })}

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-semibold">Enviar por</p>
        <div className="grid gap-1.5">
          {CANALES.map(({ key, label, icon: Icon }) => {
            const canal = data.canales[key]
            const checked = canales.includes(key)
            return (
              <label key={key} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", canal.disponible ? "cursor-pointer" : "opacity-60")}>
                <input
                  type="checkbox"
                  disabled={!canal.disponible}
                  checked={checked && canal.disponible}
                  onChange={(e) => setCanales((prev) => (e.target.checked ? [...prev, key] : prev.filter((k) => k !== key)))}
                  className="size-4 accent-[var(--brand)]"
                />
                <Icon className="size-4 text-muted-foreground" />
                <span className="flex-1">
                  {label}
                  <span className="block text-[11px] text-muted-foreground">
                    {canal.motivo ?? (key === "EMAIL" ? data.destino.email : key === "WHATSAPP" ? data.destino.telefono : "El cliente los ve al iniciar sesión")}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
        {unsaved && <p className="text-xs text-viz-warning">Tienes cambios sin guardar: guárdalos antes de enviar.</p>}
        <Button
          className="w-full rounded-xl"
          disabled={sending || saved === 0 || unsaved || canales.filter((k) => data.canales[k].disponible).length === 0}
          onClick={send}
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {saved === 0 ? "Guarda al menos un acceso para enviar" : `Enviar accesos (${saved}/${data.items.length})`}
        </Button>
        {results && (
          <ul className="space-y-1">
            {results.map((r) => (
              <li key={r.canal} className={cn("flex items-start gap-1.5 text-xs", r.ok ? "text-brand-strong dark:text-brand-bright" : "text-destructive")}>
                {r.ok ? <CheckIcon className="mt-px size-3.5 shrink-0" /> : <XIcon className="mt-px size-3.5 shrink-0" />}
                <span>
                  <strong>{CANALES.find((c) => c.key === r.canal)?.label}:</strong> {r.mensaje}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
