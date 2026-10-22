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

export type MetodoPago = "DIRECTO" | "IZIPAY" | "BINANCE_PAY";
export type EstadoPago = "PENDIENTE" | "EN_REVISION" | "PAGADO" | "RECHAZADO";

export interface Payment {
  id: string;
  metodo: MetodoPago;
  estado: EstadoPago;
  monto: number | string;
  referencia?: string | null;
  motivoRechazo?: string | null;
  tieneComprobante?: boolean;
  actualizado?: string;
}

export interface PaymentMethodOption {
  metodo: MetodoPago;
  label: string;
  disponible: boolean;
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

export type TipoNotificacion = "COMPRA" | "VENTA" | "PEDIDO" | "RESENA" | "PAGO" | "MENSAJE";

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

export interface CartItem {
  planId: string;
  plan: Plan;
  producto: Product;
  cantidad: number;
}
