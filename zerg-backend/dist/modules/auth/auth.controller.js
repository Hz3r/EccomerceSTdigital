import * as authService from "./auth.service.js";
import { validateRegister, validateLogin, } from "../../validations/auth.schema.js";
export const register = async (req, res) => {
    const dto = validateRegister(req.body);
    const result = await authService.register(dto);
    res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: result,
    });
};
export const login = async (req, res) => {
    const dto = validateLogin(req.body);
    const result = await authService.login(dto);
    res.status(200).json({
        success: true,
        message: "Inicio de sesión exitoso",
        data: result,
    });
};
export const getProfile = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ success: false, message: "No autenticado" });
        return;
    }
    const user = await authService.getProfile(userId);
    res.status(200).json({
        success: true,
        data: user,
    });
};
//# sourceMappingURL=auth.controller.js.map