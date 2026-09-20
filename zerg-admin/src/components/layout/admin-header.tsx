"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MenuIcon,
  SearchIcon,
  BellIcon,
  LogOutIcon,
  UserIcon,
  SettingsIcon,
  PackageIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { useSidebar } from "./admin-sidebar";

const notifications = [
  {
    id: 1,
    title: "Nuevo pedido recibido",
    description: "Pedido #1234 por $299.99",
    time: "Hace 5 min",
    icon: ShoppingCartIcon,
    unread: true,
  },
  {
    id: 2,
    title: "Producto bajo en stock",
    description: "Netflix Premium quedan 3 unidades",
    time: "Hace 15 min",
    icon: PackageIcon,
    unread: true,
  },
  {
    id: 3,
    title: "Reseña nueva",
    description: "Carlos dejó 5 estrellas en Disney+",
    time: "Hace 1 hora",
    icon: StarIcon,
    unread: false,
  },
];

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function AdminHeader() {
  const { user, logout } = useAuth();
  const { setOpen } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 md:h-16 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(true)}
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>


        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <SearchIcon className="h-5 w-5" />
            <span className="sr-only">Buscar</span>
          </Button>
          <div className="hidden md:block">
            <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="h-9 w-64 pl-9 lg:w-80"
            />
          </div>
        </div>

        {searchOpen && (
          <div className="absolute inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b bg-white px-4 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(false)}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="h-9 pl-9"
                autoFocus
              />
            </div>
          </div>
        )}

      </div>

      <div className="flex items-center gap-2 md:gap-3">


        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
            <BellIcon className="h-5 w-5 text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
            <span className="sr-only">Notificaciones</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificaciones</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {unreadCount} nuevas
                  </span>
                )}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex items-start gap-3 py-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.unread ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    <notification.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${notification.unread ? "text-foreground" : "text-muted-foreground"}`}>
                        {notification.title}
                      </p>
                      {notification.unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-blue-600">
              Ver todas las notificaciones
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
            <Avatar className="h-8 w-8 md:h-10 md:w-10">
              <AvatarFallback className="bg-[#2d59db] text-white text-xs md:text-sm">
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
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
