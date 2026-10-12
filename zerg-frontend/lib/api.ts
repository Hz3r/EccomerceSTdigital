import api from "./axios";
import type { Product, Category, Review, Order, User, ApiResponse } from "@/types";

export async function getProducts(): Promise<Product[]> {
  const res = await api.get<ApiResponse<Product[]>>("/products");
  return res.data.data;
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const res = await api.get<ApiResponse<Product>>(`/products/${slug}`);
  return res.data.data;
}

export async function getCategories(): Promise<Category[]> {
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
