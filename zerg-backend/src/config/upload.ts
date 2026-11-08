import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { BadRequestError } from "../errors/appError.js";
import { UPLOADS_DIR, UPLOAD_FOLDERS } from "./paths.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = String(req.params.folder || "general");
    if (!UPLOAD_FOLDERS.includes(folder)) {
      cb(new BadRequestError("Carpeta no válida"), "");
      return;
    }
    cb(null, path.join(UPLOADS_DIR, folder));
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

// Videos de las guías de ayuda ("¿Cómo comprar?"). Para videos largos conviene YouTube o TikTok.
const VIDEO_TYPES: Record<string, string> = { "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov" };
export const MAX_VIDEO_SIZE = Number(process.env.MAX_VIDEO_MB || 80) * 1024 * 1024;

export const uploadVideo = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOADS_DIR, "videos")),
    filename: (_req, file, cb) => cb(null, `${uuid()}${VIDEO_TYPES[file.mimetype] ?? ".mp4"}`),
  }),
  fileFilter: (_req, file, cb) => {
    if (!VIDEO_TYPES[file.mimetype]) {
      cb(new BadRequestError("Formato de video no permitido. Usa MP4, WebM o MOV"));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_VIDEO_SIZE },
});
