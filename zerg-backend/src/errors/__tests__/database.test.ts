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

  it("un borrado bloqueado por datos relacionados (P2003) es un 409 entendible, no un 500", () => {
    expect(databaseConnectionError(Object.assign(new Error("fk"), { code: "P2003" }))).toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("No se puede eliminar"),
    });
  });

  it("ignora los demás errores", () => {
    expect(databaseConnectionError(Object.assign(new Error("x"), { code: "P2002" }))).toBeNull();
    expect(databaseConnectionError(new Error("x"))).toBeNull();
  });
});
