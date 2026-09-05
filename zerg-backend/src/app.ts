import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import { AppError } from "./errors/appError.js";

const app: Application = express();

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("ZERG-BACKEND: ONLINE");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

export default app;
