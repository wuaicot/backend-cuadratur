// src/ocr/ocr.controller.ts
import { Request, Response } from "express";
import { OCRService } from "./ocr.service";

const ocrService = new OCRService();

export async function procesarOCR(req: Request, res: Response) {
  try {
    const { tipo } = req.body; // 'caja' | 'cocina' | 'reporteZ'

    let file: Express.Multer.File | null = null;

    // Caso 1: req.file (single file)
    if (req.file) {
      file = req.file;
    }

    // Caso 2: req.files como array (upload.array)
    else if (Array.isArray(req.files) && req.files.length > 0) {
      file = req.files[0];
    }

    // Caso 3: req.files como objeto de arrays (upload.fields)
    else if (req.files && typeof req.files === "object") {
      const firstKey = Object.keys(req.files)[0];
      const filesArray = (req.files as any)[firstKey];
      if (Array.isArray(filesArray) && filesArray.length > 0) {
        file = filesArray[0];
      }
    }

    if (!file) {
      return res.status(400).json({ error: "Archivo no recibido" });
    }

    // Validación por extensión
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"];
    const ext = (file.originalname || "").toLowerCase();

    if (!allowedExtensions.some(e => ext.endsWith(e))) {
      return res
        .status(400)
        .json({ error: "Formato de archivo no permitido. Solo imágenes." });
    }

    // Procesar imagen con buffer en memoria
    const data = await ocrService.procesarImagen(file, tipo);

    res.json({ ok: true, data });

  } catch (err) {
    console.error("Error en procesarOCR:", err);
    res.status(500).json({ error: (err as Error).message });
  }
}
