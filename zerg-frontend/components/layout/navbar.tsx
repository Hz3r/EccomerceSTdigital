"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
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
import { useSite } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

function SearchBar({ className, inputRef }: { className?: string; inputRef?: React.Ref<HTMLInputElement> }) {
  const router = useRouter();
  const { header } = useSite().settings;
  const [query, setQuery] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
      }}
      className={cn(
        "group flex h-11 items-center gap-2 rounded-xl border border-transparent bg-muted px-3.5 transition-colors focus-within:border-brand/50 focus-within:bg-background focus-within:ring-3 focus-within:ring-brand/15",
        className
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={header.buscadorPlaceholder}
        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <kbd className="hidden items-center gap-0.5 rounded-md border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline-flex">
        Ctrl K
      </kbd>
    </form>
  );
}

export function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { settings, categories } = useSite();
  const { header } = settings;
  // Categorías del menú en el orden elegido en el admin (Marca y header)
  const navCategories = header.categoriasMenu
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

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
            <nav className="flex flex-col gap-1 px-4">
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                <LayoutGrid className="size-4 text-brand-strong" />
                Todos los productos
              </Link>
              {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products?categoria=${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <CategoryIcon slug={c.slug} className="size-4" />
                    {c.nombre}
                  </Link>
              ))}
              {header.mostrarOfertas && (
                <Link
                  href="/products?ofertas=1"
                  onClick={() => setMobileOpen(false)}
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

        <SearchBar className="hidden max-w-xl flex-1 md:flex" inputRef={searchRef} />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
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
                    <Package className="size-4" />
                    Mi cuenta
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
        <SearchBar />
      </div>

      <nav className="hidden border-t md:block" aria-label="Categorías">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-1 px-6">
          <Link
            href="/products"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors hover:bg-muted",
              pathname === "/products" && "text-brand-strong"
            )}
          >
            <ChevronDown className="size-3.5" />
            Todos los productos
          </Link>
          {navCategories.map((c) => (
              <Link
                key={c.id}
                href={`/products?categoria=${c.slug}`}
                className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
              >
                <CategoryIcon slug={c.slug} className="size-3.5" />
                {c.nombre}
              </Link>
          ))}
          {header.mostrarOfertas && (
            <Link
              href="/products?ofertas=1"
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-surface-ink px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-surface-ink-hover"
            >
              <Tag className="size-3.5 text-brand-yellow" />
              Ofertas
            </Link>
          )}
          {header.anuncio && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-brand-ink">
              <Zap className="size-3.5 fill-current" />
              {header.anuncio}
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}
