import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { BadRequestError } from "../errors/appError.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FOLDERS = ["products", "categories", "avatars", "general", "branding"];

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = String(req.params.folder || "general");
    if (!ALLOWED_FOLDERS.includes(folder)) {
      cb(new BadRequestError("Carpeta no válida"), "");
      return;
    }
    cb(null, path.join("uploads", folder));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new BadRequestError("Formato de archivo no permitido. Use: JPG, PNG, WebP o GIF"));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
