"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCheck, Inbox, Loader2, Mail, MessageCircle, RotateCcw, Send, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSiteSettings } from "@/hooks/useSiteSettings"
import api from "@/lib/axios"
import { useLiveVersion } from "@/lib/live"
import { timeAgo } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { ChatMessage, Conversation } from "@/types"

const TEMAS = ["Quiero comprar", "Mi pedido", "Pagos", "Problemas con mi acceso", "Otro"]
const QUICK_REPLIES = [
  "¡Hola! Gracias por escribirnos. ¿En qué te ayudo?",
  "Ya revisamos tu pago, en unos minutos te enviamos tus accesos.",
  "¿Me compartes tu número de pedido, por favor?",
  "¡Listo! Cualquier otra duda, aquí estamos.",
]
const clock = new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" })

type Estado = "ABIERTA" | "CERRADA" | "TODAS"

export default function ChatPage() {
  return (
    <React.Suspense>
      <ChatInbox />
    </React.Suspense>
  )
}

// Bandeja de chats de la tienda: lista a la izquierda y conversación a la derecha (en el celular, una a la vez).
function ChatInbox() {
  const router = useRouter()
  const selectedId = useSearchParams().get("c")
  const [estado, setEstado] = React.useState<Estado>("ABIERTA")
  const [tema, setTema] = React.useState("")
  const [conversations, setConversations] = React.useState<Conversation[] | null>(null)
  const version = useLiveVersion("support")

  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: { conversations: Conversation[] } }>("/support/admin/conversations", {
        params: { ...(estado !== "TODAS" && { estado }), ...(tema && { tema }) },
      })
      .then((res) => !cancelled && setConversations(res.data.data.conversations))
      .catch(() => !cancelled && setConversations([]))
    return () => {
      cancelled = true
    }
  }, [estado, tema, version])

  const select = (id: string | null) => router.replace(id ? `/chat?c=${id}` : "/chat", { scroll: false })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Mensajes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chats que inician tus clientes desde el botón de ayuda de la tienda.</p>
      </div>

      <div className="grid h-[calc(100dvh-13rem)] min-h-[28rem] overflow-hidden rounded-2xl border bg-card md:grid-cols-[320px_1fr]">
        <aside className={cn("flex min-h-0 flex-col border-r", selectedId && "hidden md:flex")}>
          <div className="space-y-2 border-b p-3">
            <div className="flex gap-1" role="group" aria-label="Estado">
              {(
                [
                  ["ABIERTA", "Abiertos"],
                  ["CERRADA", "Cerrados"],
                  ["TODAS", "Todos"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={estado === id}
                  onClick={() => setEstado(id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    estado === id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto" role="group" aria-label="Tema">
              {["", ...TEMAS].map((t) => (
                <button
                  key={t || "todos"}
                  type="button"
                  aria-pressed={tema === t}
                  onClick={() => setTema(t)}
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    tema === t ? "border-brand bg-brand/15 text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t || "Todos los temas"}
                </button>
              ))}
            </div>
          </div>

          <ul className="scrollbar-thin min-h-0 flex-1 divide-y overflow-y-auto">
            {conversations === null ? (
              <li className="flex justify-center p-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </li>
            ) : conversations.length === 0 ? (
              <li className="flex flex-col items-center p-8 text-center text-sm text-muted-foreground">
                <Inbox className="size-8 opacity-40" />
                <p className="mt-2">No hay chats aquí.</p>
              </li>
            ) : (
              conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => select(c.id)}
                    className={cn("flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted", selectedId === c.id && "bg-brand/8")}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand-strong dark:text-brand-bright">
                      {c.nombre.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn("truncate text-sm", c.noLeidasAdmin ? "font-bold" : "font-medium")}>{c.nombre}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{c.ultimoMensajeEn && timeAgo(c.ultimoMensajeEn)}</span>
                      </span>
                      <span className="block truncate text-[11px] font-semibold text-muted-foreground">{c.tema}</span>
                      <span className="flex items-center gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {c.ultimoMensaje?.autor === "ADMIN" && "Tú: "}
                          {c.ultimoMensaje?.texto}
                        </span>
                        {(c.noLeidasAdmin ?? 0) > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-brand-ink">
                            {c.noLeidasAdmin}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <section className={cn("min-h-0", !selectedId && "hidden md:block")}>
          {selectedId ? (
            <Thread key={selectedId} id={selectedId} version={version} onBack={() => select(null)} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
              <MessageCircle className="size-10 opacity-30" />
              <p className="mt-3">Elige un chat para leerlo y responder.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Thread({ id, version, onBack }: { id: string; version: number; onBack: () => void }) {
  const { draft } = useSiteSettings()
  const [data, setData] = React.useState<{ conversation: Conversation; messages: ChatMessage[] } | null>(null)
  const [error, setError] = React.useState("")
  const [texto, setTexto] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: { conversation: Conversation; messages: ChatMessage[] } }>(`/support/admin/conversations/${id}`)
      .then((res) => !cancelled && setData(res.data.data))
      .catch(() => !cancelled && setError("No se pudo abrir el chat."))
    return () => {
      cancelled = true
    }
  }, [id, version])

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [data?.messages.length])

  if (error) return <p className="p-6 text-sm text-destructive">{error}</p>
  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const { conversation, messages } = data
  const phone = conversation.telefono?.replace(/\D/g, "")
  const brand = draft?.marca.nombre ?? "la tienda"

  const send = async (value: string) => {
    const text = value.trim()
    if (!text) return
    setSending(true)
    try {
      const res = await api.post<{ data: ChatMessage }>(`/support/admin/conversations/${id}/messages`, { texto: text })
      setData((d) => d && { conversation: { ...d.conversation, estado: "ABIERTA" }, messages: [...d.messages, res.data.data] })
      setTexto("")
    } catch {
      setError("No se pudo enviar el mensaje.")
    } finally {
      setSending(false)
    }
  }

  const toggleEstado = async () => {
    const estado = conversation.estado === "ABIERTA" ? "CERRADA" : "ABIERTA"
    setData((d) => d && { ...d, conversation: { ...d.conversation, estado } })
    await api.patch(`/support/admin/conversations/${id}`, { estado }).catch(() => {})
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <button type="button" onClick={onBack} aria-label="Volver a la lista" className="rounded-lg p-1 hover:bg-muted md:hidden">
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {conversation.nombre} <span className="font-normal text-muted-foreground">· {conversation.tema}</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {conversation.user && (
              <span className="inline-flex items-center gap-1">
                <User className="size-3" /> Cliente registrado
              </span>
            )}
            {(conversation.email || conversation.user?.email) && (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" /> {conversation.email || conversation.user?.email}
              </span>
            )}
            {conversation.telefono && <span>{conversation.telefono}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {phone && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              render={
                <a
                  href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${conversation.nombre}, te escribimos de ${brand} por tu consulta: ${conversation.tema}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              nativeButton={false}
            >
              <MessageCircle className="size-3.5" />
              Continuar por WhatsApp
            </Button>
          )}
          <Button size="sm" variant="ghost" className="rounded-lg" onClick={toggleEstado}>
            {conversation.estado === "ABIERTA" ? <CheckCheck className="size-3.5" /> : <RotateCcw className="size-3.5" />}
            {conversation.estado === "ABIERTA" ? "Marcar resuelto" : "Reabrir"}
          </Button>
        </div>
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.autor === "ADMIN" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line",
                m.autor === "ADMIN" ? "rounded-br-md bg-brand text-brand-ink" : "rounded-bl-md border bg-background"
              )}
            >
              {m.texto}
              <span className={cn("mt-0.5 block text-right text-[10px]", m.autor === "ADMIN" ? "text-brand-ink/60" : "text-muted-foreground")}>
                {clock.format(new Date(m.creadoEn))}
              </span>
            </div>
          </div>
        ))}
        {conversation.estado === "CERRADA" && <p className="pt-2 text-center text-[11px] text-muted-foreground">Chat resuelto. Si el cliente escribe, se reabre solo.</p>}
        <div ref={endRef} />
      </div>

      <div className="space-y-2 border-t p-3">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setTexto(q)}
              className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
            >
              {q.length > 38 ? `${q.slice(0, 38)}…` : q}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            send(texto)
          }}
        >
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send(texto)
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="Escribe tu respuesta… (Enter para enviar)"
            aria-label="Respuesta"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          <Button type="submit" className="h-10 rounded-xl" disabled={sending || !texto.trim()}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar
          </Button>
        </form>
      </div>
    </div>
  )
}
