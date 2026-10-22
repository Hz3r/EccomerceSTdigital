import { getPrisma } from "../../config/database.js";
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from "../../errors/appError.js";
import { notifyAdmins, notifyUser } from "../notifications/notification.service.js";

const MAX_COMMENT = 1000;

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
  const puntuacion = Number(data.puntuacion);
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
    throw new BadRequestError("La puntuación debe ser de 1 a 5 estrellas");
  }
  if (data.comentario !== undefined && data.comentario !== null && typeof data.comentario !== "string") {
    throw new BadRequestError("El comentario debe ser texto");
  }
  const comentario = data.comentario?.trim() || undefined;
  if (comentario && comentario.length > MAX_COMMENT) {
    throw new BadRequestError(`El comentario no puede superar los ${MAX_COMMENT} caracteres`);
  }

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

  const review = await getPrisma().review.create({
    data: { puntuacion, comentario, productId: data.productId, userId: data.userId },
    include: {
      product: { select: { id: true, nombre: true } },
      user: { select: { nombre: true } },
    },
  });

  await notifyAdmins({
    tipo: "RESENA",
    titulo: "Nueva reseña por aprobar",
    mensaje: `${review.user.nombre} · ${"★".repeat(puntuacion)} · ${review.product.nombre}`,
    href: "/reviews",
  });

  return review;
};

// Reseñas del cliente que inició sesión (también las pendientes de aprobación).
export const getMine = async (userId: string) => {
  return getPrisma().review.findMany({
    where: { userId },
    select: {
      id: true,
      productId: true,
      puntuacion: true,
      comentario: true,
      respuesta: true,
      respondidoEn: true,
      isApproved: true,
      creadoEn: true,
    },
    orderBy: { creadoEn: "desc" },
  });
};

// Aprueba (o con isApproved=false, oculta) una reseña.
export const approve = async (id: string, isApproved = true) => {
  const review = await getPrisma().review.findUnique({ where: { id } });

  if (!review) {
    throw new NotFoundError("Reseña no encontrada");
  }

  const updated = await getPrisma().review.update({
    where: { id },
    data: { isApproved },
    include: { product: { select: { nombre: true, slug: true } } },
  });

  if (isApproved && !review.isApproved) {
    await notifyUser(review.userId, {
      tipo: "RESENA",
      titulo: "Tu reseña fue publicada",
      mensaje: `Gracias por opinar sobre ${updated.product.nombre}.`,
      href: `/product/${updated.product.slug}#resenas`,
    });
  }

  return updated;
};

// Respuesta pública de la tienda a una reseña. Texto vacío = quitar la respuesta.
export const reply = async (id: string, respuesta: unknown) => {
  if (respuesta !== null && respuesta !== undefined && typeof respuesta !== "string") {
    throw new BadRequestError("La respuesta debe ser texto");
  }
  const texto = respuesta?.trim() || null;
  if (texto && texto.length > MAX_COMMENT) {
    throw new BadRequestError(`La respuesta no puede superar los ${MAX_COMMENT} caracteres`);
  }

  const review = await getPrisma().review.findUnique({ where: { id } });
  if (!review) {
    throw new NotFoundError("Reseña no encontrada");
  }

  const updated = await getPrisma().review.update({
    where: { id },
    data: { respuesta: texto, respondidoEn: texto ? new Date() : null },
    include: {
      product: { select: { id: true, nombre: true, slug: true } },
      user: { select: { id: true, nombre: true } },
    },
  });

  // Solo se avisa la primera vez que se responde (editar la respuesta no vuelve a notificar).
  if (texto && !review.respuesta) {
    await notifyUser(review.userId, {
      tipo: "RESENA",
      titulo: "Respondimos tu reseña",
      mensaje: `La tienda respondió tu opinión sobre ${updated.product.nombre}.`,
      href: `/product/${updated.product.slug}#resenas`,
    });
  }

  return updated;
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
