"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";

export default function AccountPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
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
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Mi cuenta</h1>

      <div className="mt-6 rounded-xl border p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.nombre} className="size-full rounded-full object-cover" />
            ) : (
              <User className="size-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.nombre}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Rol</span>
            <span className="text-sm font-medium">{user.rol}</span>
          </div>
          <div className="flex justify-between rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Miembro desde</span>
            <span className="text-sm font-medium">
              {new Date(user.creadoEn).toLocaleDateString("es-MX")}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
