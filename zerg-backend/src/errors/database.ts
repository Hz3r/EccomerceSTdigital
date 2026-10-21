import { AppError } from "./appError.js";

// Errores de Prisma cuando no hay conexión con PostgreSQL (servidor apagado, credenciales o base inexistente).
const DB_CONNECTION_HINTS: Record<string, string> = {
  P1000: "PostgreSQL rechazó el usuario o la contraseña de DATABASE_URL.",
  P1001: "No se puede llegar al servidor de PostgreSQL: ¿está encendido? Revisa host y puerto de DATABASE_URL.",
  P1002: "El servidor de PostgreSQL no respondió a tiempo.",
  P1003: "La base de datos indicada en DATABASE_URL no existe: créala y ejecuta `npx prisma migrate deploy`.",
  P1017: "PostgreSQL cerró la conexión.",
};

let lastWarnedCode = "";

/** Convierte un error de conexión a la base en un 503 claro; devuelve null si es otro tipo de error. */
export function databaseConnectionError(err: unknown): AppError | null {
  const code = (err as { code?: unknown })?.code;
  if (typeof code !== "string" || !(code in DB_CONNECTION_HINTS)) return null;

  // Una sola línea por tipo de fallo en la terminal, en lugar de un stack por cada petición.
  if (lastWarnedCode !== code) {
    console.error(`[database] ${code}: ${DB_CONNECTION_HINTS[code]} Revisa zerg-backend/.env y reinicia el backend.`);
    lastWarnedCode = code;
  }
  return new AppError("No hay conexión con la base de datos. Intenta de nuevo en unos minutos.", 503);
}
