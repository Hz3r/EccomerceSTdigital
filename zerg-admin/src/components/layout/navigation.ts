import {
  CreditCard,
  Home,
  LayoutDashboard,
  MessageSquareQuote,
  Package,
  PanelTop,
  PanelBottom,
  ShoppingCart,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// Menú del panel agrupado por áreas del CRM.
export const navigation: NavGroup[] = [
  {
    title: "General",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard, description: "Resumen de ventas y actividad" }],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/products", label: "Productos", icon: Package, description: "Servicios, imágenes y planes" },
      { href: "/categories", label: "Categorías", icon: Tag, description: "Organiza el catálogo" },
      { href: "/plans", label: "Planes", icon: CreditCard, description: "Duraciones y precios" },
    ],
  },
  {
    title: "Ventas y clientes",
    items: [
      { href: "/orders", label: "Órdenes", icon: ShoppingCart, description: "Pedidos y estados" },
      { href: "/users", label: "Clientes", icon: Users, description: "Usuarios registrados" },
      { href: "/reviews", label: "Reseñas", icon: MessageSquareQuote, description: "Moderación de opiniones" },
    ],
  },
  {
    title: "Contenido del sitio",
    items: [
      { href: "/content/brand", label: "Marca y header", icon: PanelTop, description: "Logo, anuncio y menú" },
      { href: "/content/home", label: "Portada", icon: Home, description: "Hero, tendencias y secciones" },
      { href: "/content/footer", label: "Contacto y pie", icon: PanelBottom, description: "Datos de contacto y pie de página" },
    ],
  },
];

export const allNavItems = navigation.flatMap((g) => g.items);

export function findNavItem(pathname: string) {
  return (
    allNavItems.find((i) => i.href === pathname) ??
    allNavItems.filter((i) => i.href !== "/" && pathname.startsWith(i.href)).sort((a, b) => b.href.length - a.href.length)[0]
  );
}
