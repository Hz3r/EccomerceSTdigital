import { getPrisma } from "../../config/database.js";
import { NotFoundError, ConflictError, ForbiddenError } from "../../errors/appError.js";

export const getAll = async () => {
  return getPrisma().review.findMany({
    include: {
      product: {
        select: { id: true, nombre: true, slug: true },
      },
      user: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: { creadoEn: "desc" },
  });
};

// Reseñas aprobadas más recientes para la portada de la tienda (sin datos personales).
export const getLatest = async (limit = 12) => {
  return getPrisma().review.findMany({
    where: { isApproved: true },
    select: {
      id: true,
      puntuacion: true,
      comentario: true,
      creadoEn: true,
      product: { select: { id: true, nombre: true, slug: true } },
      user: { select: { id: true, nombre: true } },
    },
    orderBy: { creadoEn: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
  });
};

export const getByProduct = async (productId: string) => {
  const productExists = await getPrisma().product.findUnique({
    where: { id: productId },
  });

  if (!productExists) {
    throw new NotFoundError("Producto no encontrado");
  }

  return getPrisma().review.findMany({
    where: {
      productId,
      isApproved: true,
    },
    include: {
      user: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: { creadoEn: "desc" },
  });
};

export const getById = async (id: string) => {
  const review = await getPrisma().review.findUnique({
    where: { id },
    include: {
      product: {
        select: { id: true, nombre: true, slug: true },
      },
      user: {
        select: { id: true, nombre: true },
      },
    },
  });

  if (!review) {
    throw new NotFoundError("Reseña no encontrada");
  }

  return review;
};

export const create = async (data: {
  puntuacion: number;
  comentario?: string;
  productId: string;
  userId: string;
}) => {
  const productExists = await getPrisma().product.findUnique({
    where: { id: data.productId },
  });

  if (!productExists) {
    throw new NotFoundError("Producto no encontrado");
  }

  const existingReview = await getPrisma().review.findUnique({
    where: {
      productId_userId: {
        productId: data.productId,
        userId: data.userId,
      },
    },
  });

  if (existingReview) {
    throw new ConflictError("Ya has reseñado este producto");
  }

  return getPrisma().review.create({
    data,
    include: {
      product: { select: { id: true, nombre: true } },
    },
  });
};

export const approve = async (id: string) => {
  const review = await getPrisma().review.findUnique({ where: { id } });

  if (!review) {
    throw new NotFoundError("Reseña no encontrada");
  }

  return getPrisma().review.update({
    where: { id },
    data: { isApproved: true },
  });
};

export const remove = async (id: string, userId?: string) => {
  const review = await getPrisma().review.findUnique({ where: { id } });

  if (!review) {
    throw new NotFoundError("Reseña no encontrada");
  }

  if (userId && review.userId !== userId) {
    throw new ForbiddenError("No puedes eliminar esta reseña");
  }

  await getPrisma().review.delete({ where: { id } });

  return { message: "Reseña eliminada exitosamente" };
};
