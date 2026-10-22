import { AppError } from "./appError.js";

// Errores de Prisma cuando no hay conexión con PostgreSQL (servidor apagado, credenciales o base inexistente).
const DB_CONNECTION_HINTS: Record<string, string> = {
  P1000: "PostgreSQL rechazó el usuario o la contraseña de DATABASE_URL.",
  P1001: "No se puede llegar al servidor de PostgreSQL: ¿está encendido? Revisa host y puerto de DATABASE_URL.",
  P1002: "El servidor de PostgreSQL no respondió a tiempo.",
  P1003: "La base de datos indicada en DATABASE_URL no existe: créala y ejecuta `npx prisma migrate deploy`.",
  P1017: "PostgreSQL cerró la conexión.",
};

// La base no tiene una tabla o columna que el código ya usa: falta aplicar una migración.
const DB_OUTDATED_CODES = new Set(["P2021", "P2022"]);
const MIGRATE_HINT = "En zerg-backend ejecuta `npx prisma migrate deploy` y `npx prisma generate`, y reinicia el backend.";

let lastWarnedCode = "";

function warnOnce(code: string, message: string) {
  // Una sola línea por tipo de fallo en la terminal, en lugar de un stack por cada petición.
  if (lastWarnedCode !== code) {
    console.error(message);
    lastWarnedCode = code;
  }
}

/** Convierte un error de conexión o de base desactualizada en un 503 claro; devuelve null si es otro tipo de error. */
export function databaseConnectionError(err: unknown): AppError | null {
  const code = (err as { code?: unknown })?.code;
  if (typeof code !== "string") return null;

  if (code in DB_CONNECTION_HINTS) {
    warnOnce(code, `[database] ${code}: ${DB_CONNECTION_HINTS[code]} Revisa zerg-backend/.env y reinicia el backend.`);
    return new AppError("No hay conexión con la base de datos. Intenta de nuevo en unos minutos.", 503);
  }

  if (DB_OUTDATED_CODES.has(code)) {
    const detail = err instanceof Error ? err.message.split("\n").filter(Boolean).pop() : "";
    warnOnce(code, `[database] ${code}: la base de datos está desactualizada (${detail?.trim()}). ${MIGRATE_HINT}`);
    return new AppError("La tienda se está actualizando. Intenta de nuevo en unos minutos.", 503);
  }

  return null;
}

export { MIGRATE_HINT };
