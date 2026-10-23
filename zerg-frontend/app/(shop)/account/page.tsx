"use client";

import { useAuth } from "@/hooks/useAuth";
import { loginHref } from "@/lib/auth-redirect";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { MyAccesses } from "@/components/account/my-accesses";
import { MyFavorites } from "@/components/account/my-favorites";
import { MyOrders } from "@/components/account/my-orders";
import { Button } from "@/components/ui/button";
import { Heart, KeyRound, Loader2, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "pedidos", label: "Pedidos", icon: Package },
  { id: "accesos", label: "Mis accesos", icon: KeyRound },
  { id: "favoritos", label: "Favoritos", icon: Heart },
] as const;

// Secciones de la cuenta. La pestaña va en la URL (?tab=accesos) para poder enlazarla desde avisos y correos.
function AccountTabs() {
  const params = useSearchParams();
  const requested = params.get("tab");
  const tab = TABS.find((t) => t.id === requested)?.id ?? "pedidos";

  return (
    <div className="mt-8">
      <nav aria-label="Secciones de tu cuenta" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={id === "pedidos" ? "/account" : `/account?tab=${id}`}
            scroll={false}
            aria-current={tab === id ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-semibold transition-colors",
              tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>
      {tab === "pedidos" && <MyOrders />}
      {tab === "accesos" && (
        <section className="mt-8">
          <h2 className="text-xl font-extrabold tracking-tight">Mis accesos</h2>
          <p className="text-sm text-muted-foreground">Usuarios, contraseñas y perfiles de tus servicios. No los compartas con nadie.</p>
          <MyAccesses />
        </section>
      )}
      {tab === "favoritos" && (
        <section className="mt-8 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Favoritos</h2>
            <p className="text-sm text-muted-foreground">Los productos que guardaste con el corazón.</p>
          </div>
          <MyFavorites />
        </section>
      )}
    </div>
  );
}

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

      <Suspense>
        <AccountTabs />
      </Suspense>
    </div>
  );
}
