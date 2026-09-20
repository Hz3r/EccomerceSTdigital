"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Package,
  Tag,
  CreditCard,
  ShoppingCart,
  Star,
  Users,
  LogOut,
} from "lucide-react";

export const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/categories", label: "Categorías", icon: Tag },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/plans", label: "Planes", icon: CreditCard },
  { href: "/orders", label: "Órdenes", icon: ShoppingCart },
  { href: "/reviews", label: "Reseñas", icon: Star },
  { href: "/users", label: "Usuarios", icon: Users },
];

interface SidebarContentProps {
  onLinkClick?: () => void;
}

export function SidebarContent({ onLinkClick }: SidebarContentProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-slate-800 bg-slate-950/50 md:h-16">
        <h1 className="text-lg font-bold tracking-wider text-blue-400 md:text-xl">
          ZERG <span className="text-white">Admin</span>
        </h1>
      </div>

      {/* Menu */}
      <nav className="mt-4 flex-1 space-y-1 px-3 md:mt-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-white" : "text-slate-500"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto border-t border-slate-800 p-3">
        <Separator className="mb-3 bg-slate-800 md:hidden" />
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
