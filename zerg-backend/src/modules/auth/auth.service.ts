import { getPrisma } from "../../config/database.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import { generateToken } from "../../utils/token.js";
import { verifyGoogleIdToken } from "../../utils/google.js";
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
    throw new ConflictError(
      existingUser.passwordHash
        ? "Ya existe una cuenta con este correo. Inicia sesión."
        : "Este correo ya tiene una cuenta creada con Google. Usa “Continuar con Google”."
    );
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

  if (!user) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // Cuenta creada con Google: no tiene contraseña propia.
  if (!user.passwordHash) {
    throw new UnauthorizedError(
      user.googleId ? "Esta cuenta se creó con Google. Usa “Continuar con Google”." : "Credenciales inválidas"
    );
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

// Ingreso o registro con Google. Si ya existe una cuenta con ese correo se vincula a Google
// (Google confirma que el correo es del usuario), si no se crea una cuenta nueva.
export const google = async (credential: string) => {
  const profile = await verifyGoogleIdToken(credential);
  const prisma = getPrisma();

  let user =
    (await prisma.user.findUnique({ where: { googleId: profile.googleId } })) ??
    (await prisma.user.findUnique({ where: { email: profile.email } }));

  if (user && !user.isActive) {
    throw new UnauthorizedError("Cuenta desactivada");
  }

  // Para avisar al cliente: cuenta nueva, cuenta que ya usaba Google o cuenta con contraseña recién vinculada.
  const status: "created" | "existing" | "linked" = !user ? "created" : user.googleId ? "existing" : "linked";

  const now = new Date();
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.googleId,
        avatarUrl: user.avatarUrl ?? profile.avatarUrl,
        lastLoginAt: now,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        nombre: profile.nombre,
        email: profile.email,
        googleId: profile.googleId,
        proveedor: "GOOGLE",
        avatarUrl: profile.avatarUrl,
        lastLoginAt: now,
      },
    });
  }

  const token = generateToken({ userId: user.id, email: user.email, rol: user.rol });

  return {
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt,
      creadoEn: user.creadoEn,
    },
    token,
    status,
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
