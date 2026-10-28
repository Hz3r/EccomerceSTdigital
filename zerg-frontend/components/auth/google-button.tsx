"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { USE_MOCKS } from "@/lib/api";
import { cn } from "@/lib/utils";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client?hl=es";
const THEME_EVENT = "zerg-theme-change";

// El Client ID lo da el backend (GOOGLE_CLIENT_ID): así se configura en un solo lugar.
let configPromise: Promise<string> | null = null;
function getClientId() {
  if (USE_MOCKS) return Promise.resolve("");
  configPromise ??= api
    .get<{ data: { enabled: boolean; clientId: string } }>("/auth/google/config")
    .then((res) => (res.data.data.enabled ? res.data.data.clientId : ""))
    .catch(() => {
      configPromise = null;
      return "";
    });
  return configPromise;
}

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("No se pudo cargar Google"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Google pide inicializar una sola vez por página: la respuesta se envía al botón montado.
let initializedFor = "";
let handleCredential: ((credential: string) => void) | null = null;

/**
 * Botón oficial "Continuar con Google". No se muestra si el backend no tiene GOOGLE_CLIENT_ID.
 * Entrega a `onCredential` el ID token que el backend verifica en /auth/google.
 */
export function GoogleButton({ onCredential, text = "continue_with", busy, className }: {
  onCredential: (credential: string) => void;
  text?: "continue_with" | "signup_with" | "signin_with";
  busy?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "hidden" | "error">("loading");
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  });

  useEffect(() => {
    let cancelled = false;
    const render = () => {
      const el = containerRef.current;
      if (!el || !window.google) return;
      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, {
        type: "standard",
        theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
        size: "large",
        text,
        shape: "pill",
        logo_alignment: "center",
        width: Math.min(400, Math.max(200, Math.floor(el.parentElement?.clientWidth ?? 320))),
        locale: "es",
      });
    };

    getClientId()
      .then(async (clientId) => {
        if (cancelled) return;
        if (!clientId) return setStatus("hidden");
        await loadScript();
        if (cancelled || !window.google) return;
        if (initializedFor !== clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res) => handleCredential?.(res.credential),
            ux_mode: "popup",
            itp_support: true,
          });
          initializedFor = clientId;
        }
        handleCredential = (credential) => onCredentialRef.current(credential);
        setStatus("ready");
        render();
      })
      .catch(() => !cancelled && setStatus("error"));

    // El botón de Google no cambia solo de tema: se vuelve a dibujar al cambiar claro/oscuro.
    window.addEventListener(THEME_EVENT, render);
    return () => {
      cancelled = true;
      window.removeEventListener(THEME_EVENT, render);
      handleCredential = null;
    };
  }, [text]);

  if (status === "hidden") return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative flex min-h-11 items-center justify-center">
        {status === "loading" && <div className="h-11 w-full max-w-[400px] animate-pulse rounded-full bg-muted" />}
        {status === "error" && (
          <p className="text-center text-xs text-muted-foreground">No se pudo cargar el acceso con Google. Recarga la página.</p>
        )}
        <div ref={containerRef} className={cn("flex justify-center", status !== "ready" && "hidden", busy && "pointer-events-none opacity-50")} />
        {busy && <Loader2 className="absolute size-5 animate-spin text-muted-foreground" />}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o con tu correo
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
