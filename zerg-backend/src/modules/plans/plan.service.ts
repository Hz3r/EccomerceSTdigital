import { getPrisma } from "../../config/database.js";
import { NotFoundError, ConflictError } from "../../errors/appError.js";

export const getAll = async () => {
  return getPrisma().plan.findMany({
    include: {
      product: {
        select: { id: true, nombre: true, slug: true },
      },
    },
    orderBy: { creadoEn: "desc" },
  });
};

export const getById = async (id: string) => {
  const plan = await getPrisma().plan.findUnique({
    where: { id },
    include: {
      product: {
        select: { id: true, nombre: true, slug: true },
      },
    },
  });

  if (!plan) {
    throw new NotFoundError("Plan no encontrado");
  }

  return plan;
};

export const create = async (data: {
  nombre: string;
  slug: string;
  duracion: string;
  precio: number;
  precioOriginal?: number;
  descripcion?: string;
  productId: string;
}) => {
  const slugExists = await getPrisma().plan.findUnique({
    where: { slug: data.slug },
  });

  if (slugExists) {
    throw new ConflictError("Ya existe un plan con ese slug");
  }

  const productExists = await getPrisma().product.findUnique({
    where: { id: data.productId },
  });

  if (!productExists) {
    throw new NotFoundError("Producto no encontrado");
  }

  return getPrisma().plan.create({
    data,
    include: {
      product: { select: { id: true, nombre: true } },
    },
  });
};

export const update = async (
  id: string,
  data: {
    nombre?: string;
    slug?: string;
    duracion?: string;
    precio?: number;
    precioOriginal?: number;
    descripcion?: string;
    isActivo?: boolean;
  }
) => {
  const plan = await getPrisma().plan.findUnique({ where: { id } });

  if (!plan) {
    throw new NotFoundError("Plan no encontrado");
  }

  if (data.slug && data.slug !== plan.slug) {
    const slugExists = await getPrisma().plan.findUnique({
      where: { slug: data.slug },
    });
    if (slugExists) {
      throw new ConflictError("Ya existe un plan con ese slug");
    }
  }

  return getPrisma().plan.update({
    where: { id },
    data,
    include: {
      product: { select: { id: true, nombre: true } },
    },
  });
};

export const remove = async (id: string) => {
  const plan = await getPrisma().plan.findUnique({ where: { id } });

  if (!plan) {
    throw new NotFoundError("Plan no encontrado");
  }

  await getPrisma().plan.delete({ where: { id } });

  return { message: "Plan eliminado exitosamente" };
};
