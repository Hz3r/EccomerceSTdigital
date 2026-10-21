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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login, loginWithGoogle } = useAuth();
  const { redirect, isCheckout, done } = useAuthRedirect();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  const run = async (kind: "email" | "google", action: () => Promise<void>) => {
    setError("");
    setPending(kind);
    try {
      await action();
      done();
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos iniciar sesión. Inténtalo de nuevo."));
      setPending(null);
    }
  };

  const registerHref = redirect === "/" ? "/register" : `/register?redirect=${encodeURIComponent(redirect)}`;

  return (
    <AuthShell
      title={isCheckout ? "Ingresa para finalizar tu compra" : "Bienvenido de vuelta"}
      subtitle={
        isCheckout
          ? "Tu carrito se mantiene. Ingresa o crea tu cuenta en segundos para confirmar el pedido."
          : "Ingresa a tu cuenta para ver tus pedidos y comprar más rápido."
      }
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href={registerHref} className="font-semibold text-brand-strong hover:underline">
            Regístrate gratis
          </Link>
        </>
      }
    >
      <GoogleButton
        className="mb-6"
        busy={pending === "google"}
        onCredential={(credential) => run("google", () => loginWithGoogle(credential))}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run("email", () => login(form.email, form.password));
        }}
        className="space-y-4"
      >
        {error && (
          <div role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
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
            autoComplete="current-password"
            className="h-11 rounded-xl"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl font-semibold" disabled={pending !== null}>
          {pending === "email" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            "Ingresar"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
