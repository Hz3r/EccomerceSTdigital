"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BarChart3, Loader2, MailIcon, PanelsTopLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-imput";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const PERKS = [
  { icon: BarChart3, text: "Ventas y métricas en tiempo real" },
  { icon: PanelsTopLeft, text: "Edita la portada, el logo y el header de tu tienda" },
  { icon: ShieldCheck, text: "Acceso exclusivo para administradores" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      window.location.replace("/");
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      window.location.replace("/");
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(apiMessage ?? (err instanceof Error ? err.message : "Error al iniciar sesión"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca */}
      <div className="relative isolate hidden overflow-hidden bg-surface-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 -z-10 bg-grid-soft opacity-60" />
        <div className="absolute -top-32 -left-24 -z-10 size-[28rem] rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -right-20 bottom-0 -z-10 size-80 rounded-full bg-brand-neon/15 blur-3xl" />
        <Logo className="h-10" />

        <div className="relative">
          <div className="relative mb-10 w-fit">
            <Image
              src="/zerg-icon.png"
              alt=""
              width={512}
              height={512}
              priority
              className="size-40 rounded-full shadow-[0_0_80px_-10px_var(--brand-neon)]"
            />
            <span className="absolute -top-2 -right-4 size-7 rotate-45 rounded-md bg-brand-yellow" />
            <span className="absolute right-6 -bottom-3 size-4 rotate-45 rounded bg-brand-neon" />
          </div>
          <h1 className="max-w-md text-4xl leading-tight font-extrabold tracking-tight">
            El centro de control de <span className="text-brand-gradient">tu tienda</span>
          </h1>
          <ul className="mt-8 space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand/20 text-brand-bright ring-1 ring-brand/30">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} ZERG · Panel de administración</p>
      </div>

      {/* Formulario */}
      <div className="relative flex items-center justify-center p-6">
        <ThemeToggle className="absolute top-4 right-4" />
        <div className="w-full max-w-sm">
          <Logo className="mb-10 h-9 lg:hidden" />
          <h2 className="text-3xl font-extrabold tracking-tight">Inicia sesión</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Ingresa con tu cuenta de administrador.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@zerg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar al panel"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
