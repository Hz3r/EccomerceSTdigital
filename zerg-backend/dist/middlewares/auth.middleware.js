import { verifyToken } from "../utils/token.js";
import { UnauthorizedError } from "../errors/appError.js";
export const authMiddleware = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Token no proporcionado");
    }
    const parts = authHeader.split(" ");
    const token = parts[1];
    if (!token) {
        throw new UnauthorizedError("Token no proporcionado");
    }
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    }
    catch {
        throw new UnauthorizedError("Token inválido o expirado");
    }
};
//# sourceMappingURL=auth.middleware.js.map