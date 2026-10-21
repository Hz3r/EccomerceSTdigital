export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "CLIENTE";
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  creadoEn: string;
  actualizado: string;
}

export interface Category {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagenUrl?: string;
  isActive: boolean;
  creadoEn: string;
  actualizado: string;
}

export interface Product {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  imagenUrl?: string;
  isActivo: boolean;
  categoryId: string;
  category?: Category;
  plans?: Plan[];
  reviews?: Review[];
  creadoEn: string;
  actualizado: string;
}

export interface Plan {
  id: string;
  nombre: string;
  slug: string;
  duracion: string;
  precio: number;
  precioOriginal?: number;
  descripcion?: string;
  isActivo: boolean;
  productId: string;
  product?: Product;
  creadoEn: string;
  actualizado: string;
}

export type StatusOrden = "PENDIENTE" | "ENVIADO" | "COMPLETADO" | "CANCELADO";

export interface OrderItem {
  id: string;
  cantidad: number;
  precioUnitario: number;
  planId: string;
  plan?: Plan;
  orderId: string;
  creadoEn: string;
}

export interface Order {
  id: string;
  numeroOrden: string;
  nombreCliente: string;
  email: string;
  telefono?: string;
  whatsappLink?: string;
  status: StatusOrden;
  notas?: string;
  total: number;
  userId?: string;
  user?: User;
  items?: OrderItem[];
  creadoEn: string;
  actualizado: string;
}

export interface Review {
  id: string;
  puntuacion: number;
  comentario?: string;
  isApproved: boolean;
  productId: string;
  product?: Product;
  userId: string;
  user?: User;
  creadoEn: string;
  actualizado: string;
}

export interface AdminStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalUsers: number;
  totalCustomers: number;
  activeProducts: number;
  pendingOrders: number;
  pendingReviews: number;
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  last30Days: {
    revenue: number;
    orders: number;
    averageTicket: number;
  };
  charts: {
    ventasPorDia: { fecha: string; ingresos: number; ordenes: number }[];
    ordenesPorEstado: { estado: StatusOrden; cantidad: number }[];
    ventasPorCategoria: { categoria: string; slug: string; ingresos: number }[];
    productosMasVendidos: { producto: string; slug: string; unidades: number; ingresos: number }[];
  };
  recentOrders: Order[];
  topProducts: Product[];
}

// Enlace dentro de un menú desplegable del header.
export interface MenuLink {
  etiqueta: string;
  url: string;
  imagenUrl: string;
}

// Columna de un menú desplegable.
export interface MenuGroup {
  titulo: string;
  enlaces: MenuLink[];
}

// Elemento de la barra de categorías. Con `categoria` enlaza a esa categoría; si no, a `url`.
export interface MenuItem {
  etiqueta: string;
  categoria: string;
  url: string;
  desplegable: boolean;
  grupos: MenuGroup[];
}

export interface Plataforma {
  nombre: string;
  logoUrl: string;
}

// Contenido editable de la tienda (GET/PUT /api/settings).
export interface SiteSettings {
  marca: { nombre: string; logoUrl: string; iconoUrl: string };
  header: {
    anuncio: string;
    buscadorPlaceholder: string;
    mostrarOfertas: boolean;
    menu: MenuItem[];
  };
  portada: {
    hero: {
      etiqueta: string;
      titulo: string;
      tituloDestacado: string;
      descripcion: string;
      ctaPrimarioTexto: string;
      ctaPrimarioUrl: string;
      ctaSecundarioTexto: string;
      ctaSecundarioUrl: string;
    };
    destacado: { productoSlug: string; etiqueta: string; descripcion: string };
    tendencias: string[];
    spotlight: string[];
    carruseles: string[];
    plataformas: Plataforma[];
    secciones: Record<
      | "beneficios"
      | "masBuscado"
      | "tendencias"
      | "carruseles"
      | "plataformas"
      | "categorias"
      | "opiniones"
      | "recienLlegados"
      | "creceConZerg"
      | "boletin",
      boolean
    >;
  };
  contacto: { whatsapp: string; email: string; horario: string };
  footer: { descripcion: string; metodosPago: string[] };
}

export type TipoNotificacion = "COMPRA" | "VENTA" | "PEDIDO" | "RESENA";

export interface AppNotification {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  href?: string | null;
  leida: boolean;
  orderId?: string | null;
  creadoEn: string;
}

export interface NotificationList {
  items: AppNotification[];
  unread: number;
  unreadByTipo: Record<TipoNotificacion, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
