"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/brand/logo";
import { STORE_URL } from "@/lib/format";
import { findNavItem, navigation } from "./navigation";

interface SidebarContentProps {
  onLinkClick?: () => void;
}

export function SidebarContent({ onLinkClick }: SidebarContentProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const active = findNavItem(pathname);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Link href="/" onClick={onLinkClick} className="h-8">
          <Logo className="h-8" />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Menú del panel">
        {navigation.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active?.href === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onLinkClick}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-brand/12 text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {isActive && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-brand" />}
                      <item.icon
                        className={cn(
                          "size-4.5 shrink-0",
                          isActive ? "text-brand-strong dark:text-brand-bright" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-3">
        <a
          href={STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-4.5" />
          Ver tienda
        </a>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
