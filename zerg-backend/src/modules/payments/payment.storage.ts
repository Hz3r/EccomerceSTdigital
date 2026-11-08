import path from "path";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { BadRequestError } from "../../errors/appError.js";

import { PROOFS_DIR } from "../../config/paths.js";

// Comprobantes de pago: fuera de /uploads (que es público). Solo se entregan al dueño del pedido y al admin.
// La carpeta (y si es persistente) se define en config/paths.ts.
export { PROOFS_DIR };

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
