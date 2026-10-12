import { AppError } from "../errors/appError.js";

export interface RegisterDTO {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegister = (data: unknown): RegisterDTO => {
  if (!data || typeof data !== "object") {
    throw new AppError("Request body is required", 400);
  }

  const { nombre, email, password } = data as Record<string, unknown>;

  if (!nombre || typeof nombre !== "string" || nombre.trim().length < 2) {
    throw new AppError("Nombre es requerido (mínimo 2 caracteres)", 400);
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new AppError("Email válido es requerido", 400);
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    throw new AppError("Password es requerido (mínimo 6 caracteres)", 400);
  }

  return {
    nombre: nombre.trim(),
    email: email.toLowerCase().trim(),
    password,
  };
};

export const validateLogin = (data: unknown): LoginDTO => {
  if (!data || typeof data !== "object") {
    throw new AppError("Request body is required", 400);
  }

  const { email, password } = data as Record<string, unknown>;

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new AppError("Email válido es requerido", 400);
  }

  if (!password || typeof password !== "string") {
    throw new AppError("Password es requerido", 400);
  }

  return {
    email: email.toLowerCase().trim(),
    password,
  };
};
