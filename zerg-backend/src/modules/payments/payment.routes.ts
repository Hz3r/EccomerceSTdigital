import { Router, type Router as RouterType } from "express";
import * as paymentController from "./payment.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import { uploadProof } from "./payment.storage.js";

const router: RouterType = Router();

// Públicas: métodos disponibles y webhooks de los proveedores (verifican su propia firma).
router.get("/methods", paymentController.methods);
router.post("/webhooks/izipay", paymentController.izipayIpn);
router.post("/webhooks/binance", paymentController.binanceWebhook);

router.use(authMiddleware);

// Dueño del pedido (o admin)
router.get("/order/:numero", paymentController.getOrderPayment);
router.post("/order/:numero/method", paymentController.changeMethod);
router.post("/:id/proof", uploadProof.single("file"), paymentController.submitProof);
router.get("/:id/proof", paymentController.getProof);
router.post("/:id/izipay", paymentController.startIzipay);
router.post("/:id/izipay/confirm", paymentController.confirmIzipay);
router.post("/:id/binance", paymentController.startBinance);

// Solo admin: confirmar o rechazar un pago directo
router.post("/:id/review", roleMiddleware("ADMIN"), paymentController.review);

export default router;
