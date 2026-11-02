import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const UPLOAD_FOLDERS = ["products", "categories", "avatars", "general", "branding"];

// Carpeta absoluta de las subidas públicas (zerg-backend/uploads), igual desde src/ (tsx) o dist/ (node).
// Antes multer guardaba en "uploads" relativo al directorio desde donde se arrancaba el proceso
// y express.static leía relativo al código: si no coincidían, la imagen se subía pero daba 404.
export const UPLOADS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");

for (const folder of UPLOAD_FOLDERS) {
  fs.mkdirSync(path.join(UPLOADS_DIR, folder), { recursive: true });
}
