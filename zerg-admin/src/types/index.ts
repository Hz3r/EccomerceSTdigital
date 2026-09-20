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
  pendingOrders: number;
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  recentOrders: Order[];
  topProducts: Product[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
