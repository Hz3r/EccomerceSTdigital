import { AppError } from "../errors/appError.js";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const validateRegister = (data) => {
    if (!data || typeof data !== "object") {
        throw new AppError("Request body is required", 400);
    }
    const { nombre, email, password } = data;
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
export const validateLogin = (data) => {
    if (!data || typeof data !== "object") {
        throw new AppError("Request body is required", 400);
    }
    const { email, password } = data;
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
//# sourceMappingURL=auth.schema.js.map