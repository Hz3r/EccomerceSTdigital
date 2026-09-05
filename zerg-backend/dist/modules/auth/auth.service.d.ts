import type { RegisterDTO, LoginDTO } from "../../validations/auth.schema.js";
export declare const register: (dto: RegisterDTO) => Promise<{
    user: {
        id: string;
        nombre: string;
        email: string;
        rol: import("@prisma/client").$Enums.RolUsuario;
        creadoEn: Date;
    };
    token: string;
}>;
export declare const login: (dto: LoginDTO) => Promise<{
    user: {
        id: string;
        nombre: string;
        email: string;
        rol: import("@prisma/client").$Enums.RolUsuario;
        avatarUrl: string | null;
        lastLoginAt: Date;
    };
    token: string;
}>;
export declare const getProfile: (userId: string) => Promise<{
    actualizado: Date;
    avatarUrl: string | null;
    creadoEn: Date;
    email: string;
    id: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    nombre: string;
    rol: import("@prisma/client").$Enums.RolUsuario;
}>;
//# sourceMappingURL=auth.service.d.ts.map