import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import planRoutes from "./modules/plans/plan.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import reviewRoutes from "./modules/reviews/review.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import { AppError } from "./errors/appError.js";
import { databaseConnectionError } from "./errors/database.js";
import { emitOnMutation, eventsHandler } from "./realtime/events.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// Las imágenes subidas se muestran en la tienda y el admin (otros orígenes).
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Límite general por IP. 100 era muy poco: una sola sesión del admin hace varias
// peticiones por página. Ajustable con RATE_LIMIT_MAX.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiadas peticiones, intenta más tarde" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiados intentos de login, intenta más tarde" },
});

// CORS va antes del límite para que un 429 llegue con sus cabeceras y el navegador pueda leerlo.
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      process.env.ADMIN_URL || "http://localhost:3002",
    ],
    credentials: true,
  })
);

// Tiempo real: la tienda y el admin escuchan aquí los cambios (fuera del límite general).
app.get("/api/events", eventsHandler);

app.use(generalLimiter);

app.use(express.json({ limit: "1mb" }));

app.use(
  "/api/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

app.get("/", (_req: Request, res: Response) => {
  res.send("ZERG-BACKEND: ONLINE");
});

app.use(emitOnMutation);

// El límite estricto es solo para intentos de acceso (login, registro y Google);
// /auth/profile se consulta en cada carga de página y no debe cerrar la sesión.
app.use(["/api/auth/login", "/api/auth/register", "/api/auth/google"], (req, res, next) =>
  req.method === "POST" ? authLimiter(req, res, next) : next()
);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  const dbError = databaseConnectionError(err);
  if (dbError) {
    res.status(dbError.statusCode).json({ success: false, message: dbError.message });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

export default app;
