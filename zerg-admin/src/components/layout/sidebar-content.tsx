"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/brand/logo";
import { STORE_URL } from "@/lib/format";
import { useSidebar } from "./admin-sidebar";
import { useChatUnread } from "@/hooks/useChatUnread";
import { findNavItem, navigation } from "./navigation";

interface SidebarContentProps {
  onLinkClick?: () => void;
}

// En el menú compacto (variante `collapsed:`) solo se ven los íconos; el nombre queda como tooltip.
const itemClass =
  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors collapsed:justify-center collapsed:px-0 collapsed:py-2.5";

export function SidebarContent({ onLinkClick }: SidebarContentProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { collapsed, toggleCollapsed } = useSidebar();
  const active = findNavItem(pathname);
  const tip = (label: string) => (collapsed ? label : undefined);
  const chatUnread = useChatUnread();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5 collapsed:justify-center collapsed:px-0">
        <Link href="/" onClick={onLinkClick} aria-label="Ir al dashboard" className="flex h-8 items-center">
          <Logo className="h-8 collapsed:hidden" />
          <Image src="/zerg-icon.png" alt="" width={64} height={64} className="hidden size-9 rounded-full collapsed:block" />
        </Link>
      </div>

      <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Menú del panel">
        {navigation.map((group, gi) => (
          <div key={group.title} className={cn(gi > 0 && "mt-5 collapsed:mt-3")}>
            <p className="px-3 pb-1.5 text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase collapsed:hidden">
              {group.title}
            </p>
            {gi > 0 && <div className="mx-3 mb-3 hidden h-px bg-sidebar-border collapsed:block" aria-hidden />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active?.href === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onLinkClick}
                      title={tip(item.label)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        itemClass,
                        isActive
                          ? "bg-brand/12 text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand collapsed:inset-y-2.5" />}
                      <item.icon
                        className={cn(
                          "size-[18px] shrink-0",
                          isActive ? "text-brand-strong dark:text-brand-bright" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate collapsed:sr-only">{item.label}</span>
                      {item.badge === "chat" && chatUnread > 0 && (
                        <span
                          aria-label={`${chatUnread} sin leer`}
                          className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-brand-ink collapsed:absolute collapsed:top-1 collapsed:right-1 collapsed:ml-0 collapsed:h-4 collapsed:min-w-4 collapsed:px-1"
                        >
                          {chatUnread > 99 ? "99+" : chatUnread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-sidebar-border p-3">
        <a
          href={STORE_URL}
          target="_blank"
          rel="noreferrer"
          title={tip("Ver tienda")}
          className={cn(itemClass, "text-muted-foreground hover:bg-muted hover:text-foreground")}
        >
          <ExternalLink className="size-[18px] shrink-0" />
          <span className="collapsed:sr-only">Ver tienda</span>
        </a>
        <button
          type="button"
          onClick={logout}
          title={tip("Cerrar sesión")}
          className={cn(itemClass, "w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive")}
        >
          <LogOut className="size-[18px] shrink-0" />
          <span className="collapsed:sr-only">Cerrar sesión</span>
        </button>
        {/* Solo en escritorio/tablet (en móvil el menú es un panel deslizable) */}
        {!onLinkClick && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            title={collapsed ? "Expandir menú" : undefined}
            className={cn(itemClass, "w-full text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            {collapsed ? <PanelLeftOpen className="size-[18px] shrink-0" /> : <PanelLeftClose className="size-[18px] shrink-0" />}
            <span className="collapsed:sr-only">Contraer menú</span>
          </button>
        )}
      </div>
    </div>
  );
}
