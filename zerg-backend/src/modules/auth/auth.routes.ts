import { Router, type Router as RouterType } from "express";
import * as authController from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: RouterType = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", authMiddleware, authController.getProfile);

export default router;
