import { ForbiddenError } from "../errors/appError.js";
export const roleMiddleware = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new ForbiddenError("No autenticado");
        }
        if (!allowedRoles.includes(req.user.rol)) {
            throw new ForbiddenError("No tienes permisos para realizar esta acción");
        }
        next();
    };
};
//# sourceMappingURL=role.middleware.js.map