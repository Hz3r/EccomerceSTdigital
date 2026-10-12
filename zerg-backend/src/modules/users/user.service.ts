import { getPrisma } from "../../config/database.js";
import { NotFoundError } from "../../errors/appError.js";

export const getAll = async () => {
  return getPrisma().user.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      isActive: true,
      lastLoginAt: true,
      creadoEn: true,
    },
    orderBy: { creadoEn: "desc" },
  });
};

export const getById = async (id: string) => {
  const user = await getPrisma().user.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      avatarUrl: true,
      isActive: true,
      lastLoginAt: true,
      creadoEn: true,
      actualizado: true,
    },
  });

  if (!user) {
    throw new NotFoundError("Usuario no encontrado");
  }

  return user;
};

export const update = async (
  id: string,
  data: { nombre?: string; rol?: "ADMIN" | "CLIENTE"; isActive?: boolean }
) => {
  const user = await getPrisma().user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundError("Usuario no encontrado");
  }

  return getPrisma().user.update({
    where: { id },
    data,
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      isActive: true,
      actualizado: true,
    },
  });
};

export const remove = async (id: string) => {
  const user = await getPrisma().user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundError("Usuario no encontrado");
  }

  await getPrisma().user.delete({ where: { id } });

  return { message: "Usuario eliminado exitosamente" };
};
