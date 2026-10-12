export interface RegisterDTO {
    nombre: string;
    email: string;
    password: string;
}
export interface LoginDTO {
    email: string;
    password: string;
}
export declare const validateRegister: (data: unknown) => RegisterDTO;
export declare const validateLogin: (data: unknown) => LoginDTO;
//# sourceMappingURL=auth.schema.d.ts.map