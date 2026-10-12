export const mockCategory = {
  id: "test-category-id",
  nombre: "Categoría Test",
  slug: "categoria-test",
  descripcion: "Una categoría de prueba",
  imagenUrl: "https://example.com/image.jpg",
  isActive: true,
  creadoEn: "2026-09-07T01:55:17.357Z",
  actualizado: "2026-09-07T01:55:17.357Z",
};

export const mockCategoryUpdate = {
  nombre: "Categoría Actualizada",
  slug: "categoria-actualizada",
  descripcion: "Descripción actualizada",
};

export const mockProduct = {
  id: "test-product-id",
  nombre: "Producto Test",
  slug: "producto-test",
  descripcion: "Un producto de prueba",
  imagenUrl: "https://example.com/product.jpg",
  isActivo: true,
  categoryId: "test-category-id",
  creadoEn: "2026-09-07T01:55:17.357Z",
  actualizado: "2026-09-07T01:55:17.357Z",
};

export const mockPlan = {
  id: "test-plan-id",
  nombre: "Plan Test",
  slug: "plan-test",
  duracion: "30 días",
  precio: 29.99,
  precioOriginal: 39.99,
  descripcion: "Un plan de prueba",
  isActivo: true,
  productId: "test-product-id",
  creadoEn: "2026-09-07T01:55:17.357Z",
  actualizado: "2026-09-07T01:55:17.357Z",
};

export const mockOrder = {
  id: "test-order-id",
  numeroOrden: "ORD-1234567890",
  nombreCliente: "Juan Pérez",
  email: "juan@test.com",
  telefono: "+1234567890",
  whatsappLink: null,
  status: "PENDIENTE",
  notas: null,
  total: 29.99,
  userId: null,
  creadoEn: "2026-09-07T01:55:17.357Z",
  actualizado: "2026-09-07T01:55:17.357Z",
};

export const mockReview = {
  id: "test-review-id",
  puntuacion: 5,
  comentario: "Excelente producto",
  isApproved: false,
  productId: "test-product-id",
  userId: "test-user-id",
  creadoEn: "2026-09-07T01:55:17.357Z",
  actualizado: "2026-09-07T01:55:17.357Z",
};

export const mockUser = {
  id: "test-user-id",
  nombre: "Test User",
  email: "test@test.com",
  passwordHash: "$2b$10$hashedpassword",
  googleId: null,
  proveedor: "LOCAL",
  rol: "CLIENTE",
  avatarUrl: null,
  isActive: true,
  lastLoginAt: null,
  creadoEn: "2026-09-07T01:55:17.357Z",
  actualizado: "2026-09-07T01:55:17.357Z",
};
