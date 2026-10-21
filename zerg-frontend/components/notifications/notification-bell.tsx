"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, MessageSquareText, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { safeRedirect } from "@/lib/auth-redirect";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

const ICONS = { RESENA: MessageSquareText } as Partial<Record<AppNotification["tipo"], typeof Package>>;

// Campana del cliente: avance de sus pedidos y de sus reseñas.
export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { enabled, items, unread, markRead, markAllRead } = useNotifications();
  if (!enabled) return null;

  const openNotification = (n: AppNotification) => {
    if (!n.leida) markRead(n.id);
    setOpen(false);
    if (n.href) router.push(safeRedirect(n.href));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon-lg" className="relative" />}
        aria-label={unread > 0 ? `Notificaciones (${unread} sin leer)` : "Notificaciones"}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-ink ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <PopoverTitle className="text-sm font-bold">Notificaciones</PopoverTitle>
          {unread > 0 && (
            <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline">
              <CheckCheck className="size-3.5" />
              Marcar todo como leído
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Bell className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">Sin notificaciones</p>
            <p className="mt-1 text-xs text-muted-foreground">Aquí verás el avance de tus pedidos.</p>
          </div>
        ) : (
          <ul className="max-h-[min(26rem,70vh)] divide-y overflow-y-auto">
            {items.map((n) => {
              const Icon = ICONS[n.tipo] ?? Package;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted", !n.leida && "bg-brand/5")}
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn("truncate text-sm", n.leida ? "font-medium" : "font-bold")}>{n.titulo}</span>
                        {!n.leida && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Sin leer" />}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{n.mensaje}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/80">{timeAgo(n.creadoEn)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
