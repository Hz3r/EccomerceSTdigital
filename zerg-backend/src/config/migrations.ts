import { readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getPrisma } from "./database.js";
import { MIGRATE_HINT } from "../errors/database.js";

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../prisma/migrations");

/**
 * Al arrancar avisa si hay migraciones del código que la base aún no tiene
 * (por ejemplo tras un git pull). No detiene el servidor: solo deja el aviso en la terminal.
 */
export async function warnPendingMigrations() {
  try {
    const local = (await readdir(MIGRATIONS_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    const rows = await getPrisma().$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    const applied = new Set(rows.map((r) => r.migration_name));
    const pending = local.filter((name) => !applied.has(name)).sort();
    if (pending.length > 0) {
      console.warn(
        `\n⚠️  [database] Hay ${pending.length} migración(es) sin aplicar: ${pending.join(", ")}.\n   ${MIGRATE_HINT}\n`
      );
    }
  } catch {
    // Sin conexión o sin tabla de migraciones: los errores de cada petición ya lo explican.
  }
}
