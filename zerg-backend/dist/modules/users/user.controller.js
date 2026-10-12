import * as userService from "./user.service.js";
export const getAll = async (_req, res) => {
    const users = await userService.getAll();
    res.status(200).json({
        success: true,
        data: users,
    });
};
export const getById = async (req, res) => {
    const id = req.params.id;
    const user = await userService.getById(id);
    res.status(200).json({
        success: true,
        data: user,
    });
};
export const update = async (req, res) => {
    const id = req.params.id;
    const { nombre, rol, isActive } = req.body;
    const user = await userService.update(id, { nombre, rol, isActive });
    res.status(200).json({
        success: true,
        message: "Usuario actualizado",
        data: user,
    });
};
export const remove = async (req, res) => {
    const id = req.params.id;
    const result = await userService.remove(id);
    res.status(200).json({
        success: true,
        ...result,
    });
};
//# sourceMappingURL=user.controller.js.map