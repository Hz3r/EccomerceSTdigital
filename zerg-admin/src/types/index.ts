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
  incluye?: string[] | null;
  pasos?: { titulo: string; texto: string }[] | null;
  faqs?: { pregunta: string; respuesta: string }[] | null;
  /** Imagen cuadrada para las tarjetas (tendencias, carruseles, carrito, buscador). Vacía = la portada recortada. */
  imagenTarjeta?: string | null;
  /** Nota junto al selector de cantidad en la ficha (ej. "La cantidad es el número de perfiles"). */
  notaCantidad?: string | null;
  /** false = sin stock: se muestra como agotado y no se puede comprar. */
  disponible?: boolean;
  /** Unidades a mostrar; null = sin número; 0 = agotado. */
  stock?: number | null;
  /** Texto del aviso de agotado (vacío = "Agotado"). */
  mensajeAgotado?: string | null;
  /** Fotos adicionales; la portada siempre es imagenUrl. */
  galeria?: string[] | null;
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
  /** Perfiles que incluye (ej. "1 perfil", "Cuenta completa"). Vacío = no se muestra. */
  perfiles?: string | null;
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

export type MetodoPago = "DIRECTO" | "IZIPAY" | "BINANCE_PAY";
export type EstadoPago = "PENDIENTE" | "EN_REVISION" | "PAGADO" | "RECHAZADO";

export interface Payment {
  id: string;
  metodo: MetodoPago;
  estado: EstadoPago;
  monto: number | string;
  referencia?: string | null;
  // Yape, Plin o Transferencia (pago directo)
  medio?: string | null;
  motivoRechazo?: string | null;
  tieneComprobante?: boolean;
  actualizado?: string;
}

export interface PaymentMethodOption {
  metodo: MetodoPago;
  label: string;
  disponible: boolean;
}

export interface ChatMessage {
  id: string;
  autor: "CLIENTE" | "ADMIN";
  texto: string;
  creadoEn: string;
}

export interface Conversation {
  id: string;
  tema: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  canal: "WEB" | "WHATSAPP";
  estado: "ABIERTA" | "CERRADA";
  noLeidasAdmin?: number;
  // Último mensaje del cliente por WhatsApp: con más de 24 h solo se le puede escribir con plantilla
  ultimoEntranteEn?: string | null;
  ultimoMensajeEn?: string;
  creadoEn: string;
  user?: { id: string; nombre: string; email: string } | null;
  ultimoMensaje?: { autor: "CLIENTE" | "ADMIN"; texto: string; creadoEn: string } | null;
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
  metodoPago?: MetodoPago | null;
  payment?: Payment | null;
  creadoEn: string;
  actualizado: string;
}

export interface Review {
  id: string;
  puntuacion: number;
  comentario?: string;
  respuesta?: string | null;
  respondidoEn?: string | null;
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

/** Columna de "Recién llegados". Con `productos` se muestran esos; si no, los últimos de `categorias`. */
export interface ColumnaRecientes {
  titulo: string;
  icono: string;
  color: string;
  categorias: string[];
  productos: string[];
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
    boletin: { titulo: string; descripcion: string; boton: string; mensajeExito: string };
    recienLlegados: { titulo: string; subtitulo: string; cantidad: number; columnas: ColumnaRecientes[] };
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
  pagos: {
    directo: {
      activo: boolean;
      titular: string;
      yape: string;
      plin: string;
      qrUrl: string;
      instrucciones: string;
      cuentas: CuentaBancaria[];
    };
    tipoCambioUsdt: number;
  };
  contacto: { whatsapp: string; whatsappMensaje: string; email: string; horario: string };
  footer: { descripcion: string; metodosPago: string[] };
}

export type TipoNotificacion = "COMPRA" | "VENTA" | "PEDIDO" | "RESENA" | "PAGO" | "MENSAJE";

export interface CuentaBancaria {
  banco: string;
  titular: string;
  numero: string;
  cci: string;
}

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

/** Suscriptor del boletín de la tienda. `activo` = false cuando se dio de baja. */
export interface Subscriber {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  creadoEn: string;
  actualizado: string;
}
