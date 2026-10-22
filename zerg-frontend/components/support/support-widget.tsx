"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Headphones, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useSite } from "@/hooks/useSiteSettings";
import api from "@/lib/axios";
import { USE_MOCKS } from "@/lib/api";
import { apiErrorMessage } from "@/lib/auth-redirect";
import { useLiveVersion } from "@/lib/live";
import { cn } from "@/lib/utils";

const TOKEN_KEY = "zerg-chat-token";
const TEMAS = ["Quiero comprar", "Mi pedido", "Pagos", "Problemas con mi acceso", "Otro"];

interface ChatMessage {
  id: string;
  autor: "CLIENTE" | "ADMIN";
  texto: string;
  creadoEn: string;
}

interface ChatData {
  conversation: { id: string; tema: string; nombre: string; estado: "ABIERTA" | "CERRADA" };
  messages: ChatMessage[];
  noLeidas: number;
}

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
};

const chatHeaders = () => {
  const token = readToken();
  return token ? { "X-Chat-Token": token } : {};
};

const time = new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" });

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.97 1-3.62-.24-.37a9.78 9.78 0 0 1-1.5-5.22c0-5.4 4.4-9.8 9.83-9.8a9.8 9.8 0 0 1 9.8 9.82c0 5.41-4.4 9.8-9.8 9.8zm8.34-18.13A11.73 11.73 0 0 0 12.05.2C5.55.2.27 5.47.26 11.96c0 2.08.54 4.1 1.57 5.89L.17 23.8l6.09-1.6a11.73 11.73 0 0 0 5.78 1.48h.01c6.5 0 11.78-5.28 11.78-11.77 0-3.15-1.22-6.1-3.44-8.33z" />
    </svg>
  );
}

/**
 * Botón flotante de ayuda (abajo a la derecha): chat con la tienda, que llega a la bandeja del admin,
 * o WhatsApp si está configurado. Funciona con o sin cuenta.
 */
export function SupportWidget() {
  const { user } = useAuth();
  const { contacto, marca } = useSite().settings;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "start" | "chat">("menu");
  const [chat, setChat] = useState<ChatData | null>(null);
  const [unread, setUnread] = useState(0);
  const [hasChat, setHasChat] = useState(false);
  const version = useLiveVersion("support");
  const whatsapp = contacto.whatsapp.replace(/\D/g, "");
  const enabled = !USE_MOCKS;

  // Abrir desde una notificación ("Soporte te respondió" lleva a ?chat=1)
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("chat")) return;
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Con el panel cerrado solo se consulta si hay respuestas nuevas (sin marcarlas como leídas)
  useEffect(() => {
    if (!enabled || open) return;
    if (!readToken() && !user) return;
    let cancelled = false;
    api
      .get<{ data: ChatData | null }>("/support/conversation", { params: { peek: 1 }, headers: chatHeaders() })
      .then((res) => {
        if (cancelled) return;
        setHasChat(Boolean(res.data.data));
        setUnread(res.data.data?.noLeidas ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, open, version, user]);

  // Con el chat abierto se actualiza en vivo (y marca como leídas las respuestas)
  useEffect(() => {
    if (!enabled || !open || view !== "chat") return;
    let cancelled = false;
    api
      .get<{ data: ChatData | null }>("/support/conversation", { headers: chatHeaders() })
      .then((res) => {
        if (cancelled) return;
        setChat(res.data.data);
        setHasChat(Boolean(res.data.data));
        setUnread(0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, open, view, version]);

  const openChat = () => {
    setView(hasChat ? "chat" : "start");
  };

  const waText = encodeURIComponent(`Hola ${marca.nombre}, necesito ayuda${user ? ` (soy ${user.nombre})` : ""}.`);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <div
          role="dialog"
          aria-label="Ayuda y soporte"
          className="flex h-[min(34rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 slide-in-from-bottom-3 duration-200 sm:w-96"
        >
          <header className="flex items-center gap-3 bg-surface-ink px-4 py-3.5 text-white">
            {view !== "menu" && (
              <button type="button" aria-label="Volver" onClick={() => setView("menu")} className="rounded-lg p-1 hover:bg-white/10">
                <ArrowLeft className="size-4" />
              </button>
            )}
            <span className="flex size-9 items-center justify-center rounded-full bg-brand/20 text-brand">
              <Headphones className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{view === "chat" && chat ? chat.conversation.tema : "¿Te ayudamos?"}</p>
              <p className="truncate text-xs text-white/60">{contacto.horario || "Respondemos lo antes posible"}</p>
            </div>
            <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10">
              <X className="size-4" />
            </button>
          </header>

          {view === "menu" && (
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground">
                Hola{user ? `, ${user.nombre.split(" ")[0]}` : ""} 👋 Elige cómo quieres hablar con nosotros:
              </p>
              {enabled && (
                <button
                  type="button"
                  onClick={openChat}
                  className="flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors hover:border-brand hover:bg-brand/5"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand text-brand-ink">
                    <MessageCircle className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{hasChat ? "Continuar mi chat" : "Chatear aquí"}</span>
                    <span className="block text-xs text-muted-foreground">Te respondemos en esta misma ventana.</span>
                  </span>
                  {unread > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-brand-ink">{unread}</span>}
                </button>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-[#25D366] hover:bg-[#25D366]/5"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[#25D366] text-white">
                    <WhatsAppIcon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">Escribir por WhatsApp</span>
                    <span className="block text-xs text-muted-foreground">Se abre WhatsApp con un mensaje listo.</span>
                  </span>
                </a>
              )}
              {!enabled && !whatsapp && <p className="text-sm text-muted-foreground">Escríbenos a {contacto.email}.</p>}
            </div>
          )}

          {view === "start" && (
            <StartChat
              loggedName={user?.nombre}
              onStarted={(data, token) => {
                try {
                  localStorage.setItem(TOKEN_KEY, token);
                } catch {}
                setChat(data);
                setHasChat(true);
                setView("chat");
              }}
            />
          )}

          {view === "chat" && <ChatThread chat={chat} onSent={(m) => setChat((c) => c && { ...c, messages: [...c.messages, m] })} onNew={() => setView("start")} />}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setView("menu");
        }}
        aria-label={open ? "Cerrar ayuda" : unread > 0 ? `Ayuda (${unread} mensajes nuevos)` : "¿Necesitas ayuda?"}
        className="relative flex size-14 items-center justify-center rounded-full bg-brand text-brand-ink shadow-xl ring-4 ring-background transition-transform select-none hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : whatsapp && !enabled ? <WhatsAppIcon className="size-7" /> : <MessageCircle className="size-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}

function StartChat({ loggedName, onStarted }: { loggedName?: string; onStarted: (data: ChatData, token: string) => void }) {
  const [tema, setTema] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema) return setError("Elige un tema.");
    if (!loggedName && !nombre.trim()) return setError("Escribe tu nombre.");
    if (!mensaje.trim()) return setError("Escribe tu mensaje.");
    setError("");
    setSending(true);
    try {
      const isEmail = contacto.includes("@");
      const res = await api.post<{ data: ChatData & { token: string } }>("/support/conversations", {
        tema,
        nombre: nombre.trim() || undefined,
        email: isEmail ? contacto.trim() : undefined,
        telefono: !isEmail && contacto.trim() ? contacto.trim() : undefined,
        mensaje: mensaje.trim(),
      });
      const { token, ...data } = res.data.data;
      onStarted({ ...data, noLeidas: 0 }, token);
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos iniciar el chat. Intenta de nuevo."));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      <p className="text-sm font-semibold">¿Sobre qué quieres hablar?</p>
      <div className="flex flex-wrap gap-2">
        {TEMAS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tema === t}
            onClick={() => setTema(t)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              tema === t ? "border-brand bg-brand text-brand-ink" : "hover:border-foreground/30"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {!loggedName && (
        <>
          <Input placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} className="h-10 rounded-xl" />
          <Input
            placeholder="WhatsApp o correo (opcional)"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            maxLength={120}
            className="h-10 rounded-xl"
          />
        </>
      )}
      <textarea
        placeholder="Cuéntanos en qué te ayudamos…"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        maxLength={1000}
        rows={4}
        className="w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <Button type="submit" className="mt-auto h-11 rounded-xl font-semibold" disabled={sending}>
        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Iniciar chat
      </Button>
    </form>
  );
}

function ChatThread({ chat, onSent, onNew }: { chat: ChatData | null; onSent: (m: ChatMessage) => void; onNew: () => void }) {
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chat?.messages.length]);

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = texto.trim();
    if (!value) return;
    setSending(true);
    setError("");
    try {
      const res = await api.post<{ data: ChatMessage }>("/support/conversation/messages", { texto: value }, { headers: chatHeaders() });
      onSent(res.data.data);
      setTexto("");
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo enviar. Intenta de nuevo."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
        {chat.messages.map((m) => (
          <div key={m.id} className={cn("flex", m.autor === "CLIENTE" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line",
                m.autor === "CLIENTE" ? "rounded-br-md bg-brand text-brand-ink" : "rounded-bl-md border bg-background"
              )}
            >
              {m.texto}
              <span className={cn("mt-0.5 block text-right text-[10px]", m.autor === "CLIENTE" ? "text-brand-ink/60" : "text-muted-foreground")}>
                {time.format(new Date(m.creadoEn))}
              </span>
            </div>
          </div>
        ))}
        {chat.messages.length > 0 && chat.messages[chat.messages.length - 1].autor === "CLIENTE" && (
          <p className="pt-1 text-center text-[11px] text-muted-foreground">Te responderemos por aquí. Puedes cerrar esta ventana.</p>
        )}
        {chat.conversation.estado === "CERRADA" && (
          <p className="pt-1 text-center text-[11px] text-muted-foreground">
            Este chat se cerró. Si escribes, lo volvemos a abrir, o{" "}
            <button type="button" onClick={onNew} className="font-semibold text-brand-strong underline">
              inicia uno nuevo
            </button>
            .
          </p>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t p-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="Escribe un mensaje…"
          aria-label="Mensaje"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
        <Button type="submit" size="icon-lg" className="rounded-xl" disabled={sending || !texto.trim()} aria-label="Enviar">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
      {error && <p role="alert" className="px-3 pb-2 text-xs text-destructive">{error}</p>}
    </>
  );
}
