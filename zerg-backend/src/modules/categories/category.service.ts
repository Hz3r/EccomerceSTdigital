import { getPrisma } from "../../config/database.js";
import { NotFoundError, ConflictError } from "../../errors/appError.js";

export const getAll = async () => {
  return getPrisma().category.findMany({
    orderBy: { creadoEn: "desc" },
  });
};

export const getById = async (id: string) => {
  const category = await getPrisma().category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new NotFoundError("Categoría no encontrada");
  }

  return category;
};

export const create = async (data: {
  nombre: string;
  slug: string;
  descripcion?: string;
  imagenUrl?: string;
}) => {
  const exists = await getPrisma().category.findUnique({
    where: { slug: data.slug },
  });

  if (exists) {
    throw new ConflictError("Ya existe una categoría con ese slug");
  }

  return getPrisma().category.create({
    data,
  });
};

export const update = async (
  id: string,
  data: {
    nombre?: string;
    slug?: string;
    descripcion?: string;
    imagenUrl?: string;
    isActive?: boolean;
  }
) => {
  const category = await getPrisma().category.findUnique({ where: { id } });

  if (!category) {
    throw new NotFoundError("Categoría no encontrada");
  }

  if (data.slug && data.slug !== category.slug) {
    const slugExists = await getPrisma().category.findUnique({
      where: { slug: data.slug },
    });
    if (slugExists) {
      throw new ConflictError("Ya existe una categoría con ese slug");
    }
  }

  return getPrisma().category.update({
    where: { id },
    data,
  });
};

export const remove = async (id: string) => {
  const category = await getPrisma().category.findUnique({ where: { id } });

  if (!category) {
    throw new NotFoundError("Categoría no encontrada");
  }

  await getPrisma().category.delete({ where: { id } });

  return { message: "Categoría eliminada exitosamente" };
};
