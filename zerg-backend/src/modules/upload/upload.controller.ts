import type { Response } from "express";
import type { AuthRequest } from "../../types/index.js";
import * as uploadService from "./upload.service.js";

export const uploadFile = async (req: AuthRequest, res: Response) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      message: "No se proporcionó ningún archivo",
    });
    return;
  }

  const folder = String(req.params.folder || "general");
  const url = uploadService.getUploadUrl(folder, file.filename);

  res.status(201).json({
    success: true,
    message: "Archivo subido exitosamente",
    data: {
      url,
      folder,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    },
  });
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  const folder = String(req.params.folder);
  const filename = String(req.params.filename);

  const result = await uploadService.deleteFile(folder, filename);

  res.status(200).json({
    success: true,
    ...result,
  });
};

export const getFileInfo = async (req: AuthRequest, res: Response) => {
  const folder = String(req.params.folder);
  const filename = String(req.params.filename);

  const info = uploadService.getFileInfo(folder, filename);

  res.status(200).json({
    success: true,
    data: info,
  });
};
