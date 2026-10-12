export declare const getAll: () => Promise<{
    creadoEn: Date;
    email: string;
    id: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    nombre: string;
    rol: import("@prisma/client").$Enums.RolUsuario;
}[]>;
export declare const getById: (id: string) => Promise<{
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
export declare const update: (id: string, data: {
    nombre?: string;
    rol?: "ADMIN" | "CLIENTE";
    isActive?: boolean;
}) => Promise<{
    actualizado: Date;
    email: string;
    id: string;
    isActive: boolean;
    nombre: string;
    rol: import("@prisma/client").$Enums.RolUsuario;
}>;
export declare const remove: (id: string) => Promise<{
    message: string;
}>;
//# sourceMappingURL=user.service.d.ts.map