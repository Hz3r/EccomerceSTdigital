"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Tag,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CategoryIcon } from "@/components/product/category-icon";
import { SearchBox } from "@/components/layout/search-box";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DesktopMenu, MobileAccordion, MobileMenuItem, resolveMenu } from "@/components/layout/nav-menu";
import { useSite } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { settings, categories } = useSite();
  const { header } = settings;
  // Menú en el orden elegido en el admin (Marca y header); algunos elementos son desplegables
  const menu = resolveMenu(header.menu, categories);
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-20 md:gap-6 md:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon-lg" className="-ml-2 md:hidden" />}>
            <Menu className="size-5" />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="h-8">
                <Logo className="h-8" />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6">
              <Link
                href="/products"
                onClick={closeMobile}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                <LayoutGrid className="size-4 text-brand-strong" />
                Todos los productos
              </Link>
              {menu.map((item) => (
                <MobileMenuItem key={item.key} item={item} onNavigate={closeMobile} />
              ))}
              {categories.length > 0 && (
                <MobileAccordion
                  label="Todas las categorías"
                  expanded={allCategoriesOpen}
                  onToggle={() => setAllCategoriesOpen((o) => !o)}
                >
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/products?categoria=${c.slug}`}
                      onClick={closeMobile}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <CategoryIcon slug={c.slug} className="size-4" />
                      {c.nombre}
                    </Link>
                  ))}
                </MobileAccordion>
              )}
              {header.mostrarOfertas && (
                <Link
                  href="/products?ofertas=1"
                  onClick={closeMobile}
                  className="mt-2 flex items-center gap-3 rounded-lg bg-surface-ink px-3 py-2.5 text-sm font-semibold text-white"
                >
                  <Tag className="size-4 text-brand-yellow" />
                  Ofertas
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Logo className="h-8 md:h-10" priority />

        <SearchBox className="hidden max-w-xl flex-1 md:block" inputRef={searchRef} />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {user && <NotificationBell />}
          {!isLoading &&
            (user ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" className="rounded-full" />}>
                  <Avatar size="sm">
                    <AvatarImage src={user.avatarUrl} alt={user.nombre} />
                    <AvatarFallback className="bg-brand text-brand-ink font-semibold">
                      {user.nombre.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.nombre}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/account" />}>
                    <User className="size-4" />
                    Mi cuenta
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/account#pedidos" />}>
                    <Package className="size-4" />
                    Mis pedidos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={logout}>
                    <LogOut className="size-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="hidden h-10 rounded-lg border-foreground/30 px-4 font-semibold sm:inline-flex"
                  render={<Link href="/register" />}
                  nativeButton={false}
                >
                  Registrarse
                </Button>
                <Button
                  className="hidden h-10 rounded-lg px-4 font-semibold sm:inline-flex"
                  render={<Link href="/login" />}
                  nativeButton={false}
                >
                  Ingresar
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="sm:hidden"
                  render={<Link href="/login" aria-label="Ingresar" />}
                  nativeButton={false}
                >
                  <User className="size-5" />
                </Button>
              </>
            ))}

          <Link
            href="/cart"
            aria-label={`Carrito (${totalItems})`}
            className="relative ml-1 inline-flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <ShoppingCart className="size-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-brand-yellow text-[10px] font-bold text-brand-ink ring-2 ring-background">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <SearchBox />
      </div>

      <nav className="hidden border-t md:block" aria-label="Categorías">
        <DesktopMenu items={menu}>
          <Link
            href="/products"
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors hover:bg-muted",
              pathname === "/products" && "text-brand-strong"
            )}
          >
            <LayoutGrid className="size-3.5" />
            Todos los productos
          </Link>
          {header.mostrarOfertas && (
            <Link
              href="/products?ofertas=1"
              className="order-last ml-2 flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-ink px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-surface-ink-hover"
            >
              <Tag className="size-3.5 text-brand-yellow" />
              Ofertas
            </Link>
          )}
          {header.anuncio && (
            <span className="order-last ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-brand-ink lg:inline-flex">
              <Zap className="size-3.5 fill-current" />
              {header.anuncio}
            </span>
          )}
        </DesktopMenu>
      </nav>
    </header>
  );
}
