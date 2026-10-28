"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";
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
import { ExternalLink, LogOutIcon, MenuIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLiveStatus } from "@/lib/live";
import { STORE_URL } from "@/lib/format";
import { useSidebar } from "./admin-sidebar";
import { findNavItem, navigation } from "./navigation";

export function AdminHeader() {
  const { user, logout } = useAuth();
  const { setOpen, collapsed, toggleCollapsed } = useSidebar();
  const live = useLiveStatus();
  const pathname = usePathname();

  const current = findNavItem(pathname);
  const group = navigation.find((g) => g.items.some((i) => i.href === current?.href));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
          <MenuIcon className="size-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden text-muted-foreground md:inline-flex"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>
        <div className="min-w-0">
          {group && (
            <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">{group.title}</p>
          )}
          <p className="truncate text-sm font-semibold md:text-base">{current?.label ?? "Panel"}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted-foreground lg:inline-flex"
          title={live ? "Recibiendo cambios de la tienda en tiempo real" : "Sin conexión en tiempo real; se reintenta sola"}
        >
          <span className={live ? "relative flex size-2" : "flex size-2"}>
            {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />}
            <span className={live ? "relative inline-flex size-2 rounded-full bg-brand" : "inline-flex size-2 rounded-full bg-muted-foreground/50"} />
          </span>
          {live ? "En vivo" : "Sin conexión"}
        </span>
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

        <NotificationBell />

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
