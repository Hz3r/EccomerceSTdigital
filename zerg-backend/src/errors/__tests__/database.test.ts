import { describe, it, expect, vi } from "vitest";
import { databaseConnectionError } from "../database.js";

describe("databaseConnectionError", () => {
  it("convierte los errores de conexión de Prisma en un 503 claro", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const code of ["P1000", "P1001", "P1003"]) {
      expect(databaseConnectionError(Object.assign(new Error("db"), { code }))).toMatchObject({
        statusCode: 503,
        message: expect.stringContaining("base de datos"),
      });
    }
  });

  it("ignora los demás errores", () => {
    expect(databaseConnectionError(Object.assign(new Error("x"), { code: "P2002" }))).toBeNull();
    expect(databaseConnectionError(new Error("x"))).toBeNull();
  });
});
