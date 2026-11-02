import fs from "fs/promises";
import path from "path";
import { NotFoundError, BadRequestError } from "../../errors/appError.js";
import { UPLOADS_DIR, UPLOAD_FOLDERS as ALLOWED_FOLDERS } from "../../config/paths.js";

export const getUploadUrl = (folder: string, filename: string) => {
  return `/api/uploads/${folder}/${filename}`;
};

export const deleteFile = async (folder: string, filename: string) => {
  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw new BadRequestError("Carpeta no válida");
  }

  const filePath = path.join(UPLOADS_DIR, folder, path.basename(filename));

  try {
    await fs.access(filePath);
  } catch {
    throw new NotFoundError("Archivo no encontrado");
  }

  await fs.unlink(filePath);

  return { message: "Archivo eliminado exitosamente" };
};

export const getFileInfo = (folder: string, filename: string) => {
  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw new BadRequestError("Carpeta no válida");
  }

  return {
    url: `/api/uploads/${folder}/${filename}`,
    folder,
    filename,
  };
};
