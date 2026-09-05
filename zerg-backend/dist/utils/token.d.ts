import type { RolUsuario } from "@prisma/client";
export interface TokenPayload {
    userId: string;
    email: string;
    rol: RolUsuario;
}
export declare const generateToken: (payload: TokenPayload) => string;
export declare const verifyToken: (token: string) => TokenPayload;
//# sourceMappingURL=token.d.ts.map