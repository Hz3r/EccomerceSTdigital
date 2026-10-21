"use client";

import { useAuth } from "@/hooks/useAuth";
import { loginHref } from "@/lib/auth-redirect";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";

export default function AccountPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(loginHref("/account"));
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Mi cuenta</h1>

      <div className="mt-8 overflow-hidden rounded-3xl border bg-card">
        <div className="h-24 bg-brand-gradient">
          <div className="size-full bg-checker opacity-60" />
        </div>
        <div className="-mt-10 flex items-end gap-4 px-6">
          <div className="flex size-20 items-center justify-center rounded-full bg-surface-ink ring-4 ring-card">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.nombre} className="size-full rounded-full object-cover" />
            ) : (
              <User className="size-8 text-brand" />
            )}
          </div>
          <div className="pb-1">
            <h2 className="text-lg font-bold">{user.nombre}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 px-6">
          <div className="flex justify-between rounded-lg bg-brand-mint px-4 py-3">
            <span className="text-sm text-muted-foreground">Rol</span>
            <span className="text-sm font-medium">{user.rol}</span>
          </div>
          <div className="flex justify-between rounded-lg bg-brand-mint px-4 py-3">
            <span className="text-sm text-muted-foreground">Miembro desde</span>
            <span className="text-sm font-medium">
              {new Date(user.creadoEn).toLocaleDateString("es-MX")}
            </span>
          </div>
        </div>

        <div className="p-6">
          <Button variant="outline" className="h-11 w-full rounded-xl" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
