// Carga el .env antes de leer DATA_DIR: los import se evalúan antes que dotenv.config() en server.ts.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const UPLOAD_FOLDERS = ["products", "categories", "avatars", "general", "branding"];

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Carpeta de datos persistentes (imágenes subidas y comprobantes de pago).
 * En Railway el disco del contenedor se borra en cada despliegue: hay que montar un Volume.
 * Railway define RAILWAY_VOLUME_MOUNT_PATH al montarlo, así que basta con agregar el Volume.
 * DATA_DIR permite elegir otra carpeta. Sin ninguno, se usa zerg-backend/ (desarrollo local).
 */
const dataDir = process.env.DATA_DIR?.trim() || process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim() || "";
export const PERSISTENT_STORAGE = Boolean(dataDir);

// Imágenes públicas (/api/uploads). Antes multer guardaba relativo al directorio de arranque y
// express.static leía relativo al código: si no coincidían, la imagen se subía pero daba 404.
export const UPLOADS_DIR = dataDir ? path.resolve(dataDir, "uploads") : path.join(backendRoot, "uploads");

// Comprobantes de pago: nunca se sirven por /api/uploads.
export const PROOFS_DIR = dataDir ? path.resolve(dataDir, "comprobantes") : path.join(backendRoot, "private", "comprobantes");

for (const folder of UPLOAD_FOLDERS) {
  fs.mkdirSync(path.join(UPLOADS_DIR, folder), { recursive: true });
}
fs.mkdirSync(PROOFS_DIR, { recursive: true });

if (!dataDir && process.env.RAILWAY_ENVIRONMENT) {
  console.warn(
    "[uploads] Sin Volume: las imágenes y comprobantes se BORRAN en cada despliegue de Railway. " +
      "Agrega un Volume al servicio del backend (se detecta solo con RAILWAY_VOLUME_MOUNT_PATH)."
  );
}
