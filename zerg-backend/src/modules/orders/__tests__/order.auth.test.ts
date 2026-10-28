import { describe, it, expect } from "vitest";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { mockPrisma } from "../../../test/mocks/prisma.mock.js";
import { AppError } from "../../../errors/appError.js";
import orderRoutes from "../order.routes.js";

const app = express();
app.use(express.json());
app.use("/api/orders", orderRoutes);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err instanceof AppError ? err.statusCode : 500).json({ success: false, message: err.message });
});

describe("POST /api/orders sin sesión", () => {
  it("responde 401 y no crea la orden", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({ nombreCliente: "Invitado", email: "invitado@test.com", items: [{ planId: "p", cantidad: 1 }] });

    expect(response.status).toBe(401);
    expect(mockPrisma.order.create).not.toHaveBeenCalled();
  });
});
