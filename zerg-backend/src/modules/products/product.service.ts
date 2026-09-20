import { getPrisma } from "../../config/database.js";
import { NotFoundError, ConflictError } from "../../errors/appError.js";

export const getAll = async () => {
  return getPrisma().product.findMany({
    include: {
      category: {
        select: { id: true, nombre: true, slug: true },
      },
      plans: {
        where: { isActivo: true },
        select: { id: true, nombre: true, precio: true, duracion: true },
      },
    },
    orderBy: { creadoEn: "desc" },
  });
};

export const getById = async (id: string) => {
  const product = await getPrisma().product.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, nombre: true, slug: true },
      },
      plans: true,
      reviews: {
        where: { isApproved: true },
        select: {
          id: true,
          puntuacion: true,
          comentario: true,
          user: { select: { id: true, nombre: true } },
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundError("Producto no encontrado");
  }

  return product;
};

export const create = async (data: {
  nombre: string;
  slug: string;
  descripcion?: string;
  imagenUrl?: string;
  categoryId: string;
}) => {
  const slugExists = await getPrisma().product.findUnique({
    where: { slug: data.slug },
  });

  if (slugExists) {
    throw new ConflictError("Ya existe un producto con ese slug");
  }

  const categoryExists = await getPrisma().category.findUnique({
    where: { id: data.categoryId },
  });

  if (!categoryExists) {
    throw new NotFoundError("Categoría no encontrada");
  }

  return getPrisma().product.create({
    data,
    include: {
      category: { select: { id: true, nombre: true } },
    },
  });
};

export const update = async (
  id: string,
  data: {
    nombre?: string;
    slug?: string;
    descripcion?: string;
    imagenUrl?: string;
    categoryId?: string;
    isActivo?: boolean;
  }
) => {
  const product = await getPrisma().product.findUnique({ where: { id } });

  if (!product) {
    throw new NotFoundError("Producto no encontrado");
  }

  if (data.slug && data.slug !== product.slug) {
    const slugExists = await getPrisma().product.findUnique({
      where: { slug: data.slug },
    });
    if (slugExists) {
      throw new ConflictError("Ya existe un producto con ese slug");
    }
  }

  if (data.categoryId) {
    const categoryExists = await getPrisma().category.findUnique({
      where: { id: data.categoryId },
    });
    if (!categoryExists) {
      throw new NotFoundError("Categoría no encontrada");
    }
  }

  return getPrisma().product.update({
    where: { id },
    data,
    include: {
      category: { select: { id: true, nombre: true } },
    },
  });
};

export const remove = async (id: string) => {
  const product = await getPrisma().product.findUnique({ where: { id } });

  if (!product) {
    throw new NotFoundError("Producto no encontrado");
  }

  await getPrisma().product.delete({ where: { id } });

  return { message: "Producto eliminado exitosamente" };
};
