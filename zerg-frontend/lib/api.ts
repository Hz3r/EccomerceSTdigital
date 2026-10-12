import api from "./axios";
import { mockCategories, mockProducts } from "./mock-data";
import type { Product, Category, Review, Order, User, ApiResponse } from "@/types";

// Modo diseño: sin NEXT_PUBLIC_API_URL (o con NEXT_PUBLIC_USE_MOCKS=true) el catálogo
// se sirve desde lib/mock-data.ts para poder trabajar el frontend sin backend.
export const USE_MOCKS =
  process.env.NEXT_PUBLIC_USE_MOCKS === "true" || !process.env.NEXT_PUBLIC_API_URL;

// Prisma serializa los Decimal como texto ("24.90"): se convierten a número para poder operar.
function normalizeProduct(product: Product): Product {
  return {
    ...product,
    plans: product.plans?.map((plan) => ({
      ...plan,
      precio: Number(plan.precio),
      precioOriginal: plan.precioOriginal == null ? undefined : Number(plan.precioOriginal),
    })),
  };
}

export async function getProducts(): Promise<Product[]> {
  if (USE_MOCKS) return mockProducts;
  const res = await api.get<ApiResponse<Product[]>>("/products");
  return res.data.data.map(normalizeProduct);
}

export async function getProductBySlug(slug: string): Promise<Product> {
  if (USE_MOCKS) {
    const product = mockProducts.find((p) => p.slug === slug);
    if (!product) throw new Error("Producto no encontrado");
    return product;
  }
  const res = await api.get<ApiResponse<Product>>(`/products/${slug}`);
  return normalizeProduct(res.data.data);
}

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCKS) return mockCategories;
  const res = await api.get<ApiResponse<Category[]>>("/categories");
  return res.data.data;
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const res = await api.get<ApiResponse<Review[]>>(`/reviews/product/${productId}`);
  return res.data.data;
}

export async function login(email: string, password: string) {
  const res = await api.post<ApiResponse<{ user: User; token: string }>>("/auth/login", {
    email,
    password,
  });
  return res.data.data;
}

export async function register(nombre: string, email: string, password: string) {
  const res = await api.post<ApiResponse<{ user: User; token: string }>>("/auth/register", {
    nombre,
    email,
    password,
  });
  return res.data.data;
}

export async function getProfile(): Promise<User> {
  const res = await api.get<ApiResponse<User>>("/auth/profile");
  return res.data.data;
}

export async function createOrder(order: {
  nombreCliente: string;
  email: string;
  telefono?: string;
  notas?: string;
  userId?: string;
  items: { planId: string; cantidad: number }[];
}): Promise<Order> {
  if (USE_MOCKS) {
    const now = new Date().toISOString();
    return {
      id: `mock-${Date.now()}`,
      numeroOrden: `ZRG-${Date.now().toString().slice(-6)}`,
      nombreCliente: order.nombreCliente,
      email: order.email,
      telefono: order.telefono,
      notas: order.notas,
      status: "PENDIENTE",
      total: 0,
      userId: order.userId,
      creadoEn: now,
      actualizado: now,
    };
  }
  const res = await api.post<ApiResponse<Order>>("/orders", order);
  return res.data.data;
}

export async function getOrderById(id: string): Promise<Order> {
  const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
  return res.data.data;
}

export async function createReview(data: {
  puntuacion: number;
  comentario?: string;
  productId: string;
}): Promise<Review> {
  const res = await api.post<ApiResponse<Review>>("/reviews", data);
  return res.data.data;
}
