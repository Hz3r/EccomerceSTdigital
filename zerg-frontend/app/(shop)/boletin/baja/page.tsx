"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/auth-redirect";

// Página a la que lleva el enlace "Darse de baja" de los correos del boletín.
export default function UnsubscribePage() {
  return (
    <Suspense>
      <Unsubscribe />
    </Suspense>
  );
}

function Unsubscribe() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const token = params.get("t") ?? "";
  const valid = Boolean(id && token);
  const [state, setState] = useState<{ status: "loading" | "done" | "error"; email?: string; error?: string }>({ status: "loading" });
  const started = useRef(false);

  useEffect(() => {
    if (!valid || started.current) return;
    started.current = true;
    api
      .post<{ data: { email: string } }>("/newsletter/unsubscribe", { id, t: token })
      .then((res) => setState({ status: "done", email: res.data.data.email }))
      .catch((err) => setState({ status: "error", error: apiErrorMessage(err, "No pudimos procesar tu baja. Intenta de nuevo.") }));
  }, [valid, id, token]);

  const view = !valid ? { status: "error" as const, error: "Este enlace de baja no es válido." } : state;

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      {view.status === "loading" && (
        <>
          <Loader2 className="size-10 animate-spin text-brand" />
          <p className="mt-4 text-sm text-muted-foreground">Procesando tu baja…</p>
        </>
      )}
      {view.status === "done" && (
        <>
          <CheckCircle2 className="size-12 text-brand" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Te diste de baja</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {view.email ? <><span className="font-medium text-foreground">{view.email}</span> ya no</> : "Ya no"} recibirá correos de nuestro boletín.
            Si fue un error, puedes volver a suscribirte desde la tienda.
          </p>
        </>
      )}
      {view.status === "error" && (
        <>
          <MailX className="size-12 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">No pudimos darte de baja</h1>
          <p className="mt-2 text-sm text-muted-foreground">{view.error}</p>
        </>
      )}
      <Button nativeButton={false} render={<Link href="/" />} className="mt-8 rounded-xl">
        Ir a la tienda
      </Button>
    </section>
  );
}
