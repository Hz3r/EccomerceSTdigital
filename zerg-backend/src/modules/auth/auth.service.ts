import { getPrisma } from "../../config/database.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import { generateToken } from "../../utils/token.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../../errors/appError.js";
import type { RegisterDTO, LoginDTO } from "../../validations/auth.schema.js";

export const register = async (dto: RegisterDTO) => {
  const existingUser = await getPrisma().user.findUnique({
    where: { email: dto.email },
  });

  if (existingUser) {
    throw new ConflictError("El email ya está registrado");
  }

  const passwordHash = await hashPassword(dto.password);

  const user = await getPrisma().user.create({
    data: {
      nombre: dto.nombre,
      email: dto.email,
      passwordHash,
    },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    rol: user.rol,
  });

  return {
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      creadoEn: user.creadoEn,
    },
    token,
  };
};

export const login = async (dto: LoginDTO) => {
  const user = await getPrisma().user.findUnique({
    where: { email: dto.email },
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  if (!user.isActive) {
    throw new UnauthorizedError("Cuenta desactivada");
  }

  const isPasswordValid = await comparePassword(dto.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  await getPrisma().user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    rol: user.rol,
  });

  return {
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      avatarUrl: user.avatarUrl,
      lastLoginAt: new Date(),
    },
    token,
  };
};

export const getProfile = async (userId: string) => {
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
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
