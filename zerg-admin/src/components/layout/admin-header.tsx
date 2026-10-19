"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BellIcon, ExternalLink, LogOutIcon, MenuIcon, MessageSquareQuote, ShoppingCartIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import api from "@/lib/axios";
import { STORE_URL } from "@/lib/format";
import type { AdminStats } from "@/types";
import { useSidebar } from "./admin-sidebar";
import { findNavItem, navigation } from "./navigation";

export function AdminHeader() {
  const { user, logout } = useAuth();
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const [pending, setPending] = useState({ orders: 0, reviews: 0 });

  const current = findNavItem(pathname);
  const group = navigation.find((g) => g.items.some((i) => i.href === current?.href));

  // Avisos reales: pedidos pendientes y reseñas por aprobar.
  useEffect(() => {
    api
      .get<{ data: AdminStats }>("/admin/stats")
      .then((res) => setPending({ orders: res.data.data.pendingOrders, reviews: res.data.data.pendingReviews ?? 0 }))
      .catch(() => {});
  }, [pathname]);

  const notifications = [
    pending.orders > 0 && {
      href: "/orders",
      icon: ShoppingCartIcon,
      title: `${pending.orders} ${pending.orders === 1 ? "pedido pendiente" : "pedidos pendientes"}`,
      text: "Revisa y entrega los accesos",
    },
    pending.reviews > 0 && {
      href: "/reviews",
      icon: MessageSquareQuote,
      title: `${pending.reviews} ${pending.reviews === 1 ? "reseña por aprobar" : "reseñas por aprobar"}`,
      text: "Apruébalas para mostrarlas en la tienda",
    },
  ].filter(Boolean) as { href: string; icon: typeof BellIcon; title: string; text: string }[];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
          <MenuIcon className="size-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
        <div className="min-w-0">
          {group && (
            <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">{group.title}</p>
          )}
          <p className="truncate text-sm font-semibold md:text-base">{current?.label ?? "Panel"}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <a
          href={STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors hover:border-brand hover:text-brand-strong sm:inline-flex dark:hover:text-brand-bright"
        >
          <ExternalLink className="size-3.5" />
          Ver tienda
        </a>
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative size-10" />}>
            <BellIcon className="size-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-brand-yellow text-[10px] font-bold text-brand-ink">
                {notifications.length}
              </span>
            )}
            <span className="sr-only">Notificaciones</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Todo al día. No hay pendientes.</p>
            ) : (
              <DropdownMenuGroup>
                {notifications.map((n) => (
                  <DropdownMenuItem key={n.href} render={<Link href={n.href} />} className="flex items-start gap-3 py-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong dark:text-brand-bright">
                      <n.icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{n.title}</span>
                      <span className="block text-xs text-muted-foreground">{n.text}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-10 rounded-full" />}>
            <Avatar className="size-9">
              <AvatarFallback className="bg-brand text-sm font-bold text-brand-ink">
                {user?.nombre?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user?.nombre || "Admin"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOutIcon className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
