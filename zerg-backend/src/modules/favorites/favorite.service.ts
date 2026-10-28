import { getPrisma } from "../../config/database.js";
import { NotFoundError } from "../../errors/appError.js";

/** Favoritos del cliente, con el producto y sus planes activos (para mostrarlos en "Mis favoritos"). */
export const list = async (userId: string) => {
  const favorites = await getPrisma().favorite.findMany({
    where: { userId, product: { isActivo: true } },
    orderBy: { creadoEn: "desc" },
    include: {
      product: {
        include: {
          category: { select: { id: true, nombre: true, slug: true } },
          plans: { where: { isActivo: true }, orderBy: { precio: "asc" } },
        },
      },
    },
  });
  return favorites.map((f) => f.product);
};

export const ids = async (userId: string) =>
  (await getPrisma().favorite.findMany({ where: { userId }, select: { productId: true } })).map((f) => f.productId);

export const add = async (userId: string, productId: string) => {
  const product = await getPrisma().product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw new NotFoundError("Producto no encontrado");
  await getPrisma().favorite.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
  return { productId, favorito: true };
};

export const remove = async (userId: string, productId: string) => {
  await getPrisma().favorite.deleteMany({ where: { userId, productId } });
  return { productId, favorito: false };
};
