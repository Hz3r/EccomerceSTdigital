import prisma from "../../config/database.js";
import { NotFoundError } from "../../errors/appError.js";
export const getAll = async () => {
    return prisma.user.findMany({
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
export const getById = async (id) => {
    const user = await prisma.user.findUnique({
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
export const update = async (id, data) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        throw new NotFoundError("Usuario no encontrado");
    }
    return prisma.user.update({
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
export const remove = async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        throw new NotFoundError("Usuario no encontrado");
    }
    await prisma.user.delete({ where: { id } });
    return { message: "Usuario eliminado exitosamente" };
};
//# sourceMappingURL=user.service.js.map