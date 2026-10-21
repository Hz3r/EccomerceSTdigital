"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { apiErrorMessage } from "@/lib/auth-redirect";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { register, loginWithGoogle } = useAuth();
  const { redirect, isCheckout, done } = useAuthRedirect();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });

  const run = async (kind: "email" | "google", action: () => Promise<void>) => {
    setError("");
    setPending(kind);
    try {
      await action();
      done();
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos crear tu cuenta. Inténtalo de nuevo."));
      setPending(null);
    }
  };

  const loginHref = redirect === "/" ? "/login" : `/login?redirect=${encodeURIComponent(redirect)}`;

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle={
        isCheckout
          ? "Crea tu cuenta para confirmar tu pedido. Tu carrito se mantiene."
          : "Regístrate en segundos y guarda el historial de tus compras."
      }
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href={loginHref} className="font-semibold text-brand-strong hover:underline">
            Ingresa aquí
          </Link>
        </>
      }
    >
      <GoogleButton
        className="mb-6"
        text="signup_with"
        busy={pending === "google"}
        onCredential={(credential) => run("google", () => loginWithGoogle(credential))}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run("email", () => register(form.nombre, form.email, form.password));
        }}
        className="space-y-4"
      >
        {error && (
          <div role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            autoComplete="name"
            className="h-11 rounded-xl"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            minLength={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="h-11 rounded-xl"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="h-11 rounded-xl"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
          <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl font-semibold" disabled={pending !== null}>
          {pending === "email" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            "Crear cuenta"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
