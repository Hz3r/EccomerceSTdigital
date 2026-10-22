import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { BadRequestError } from "../../errors/appError.js";

// Comprobantes de pago: fuera de /uploads (que es público). Solo se entregan al dueño del pedido y al admin.
export const PROOFS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../private/comprobantes");
mkdirSync(PROOFS_DIR, { recursive: true });

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const uploadProof = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PROOFS_DIR),
    // El nombre no usa el del archivo original: solo un uuid y la extensión según el tipo real
    filename: (_req, file, cb) => cb(null, `${uuid()}${ALLOWED[file.mimetype] ?? ""}`),
  }),
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      cb(new BadRequestError("Sube una imagen JPG, PNG o WebP de tu comprobante"));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const proofPath = (filename: string) => path.join(PROOFS_DIR, path.basename(filename));
