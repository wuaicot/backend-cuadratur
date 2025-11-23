import { Request, Response } from "express";
import { OCRService } from "./ocr.service";
import path from "path";

const ocrService = new OCRService();

export async function procesarOCR(req: Request, res: Response) {
  try {
    const { tipo } = req.body; // 'caja' | 'cocina' | 'reporteZ'
    const file = Array.isArray(req.files) && req.files.length > 0 ? req.files[0] : null;

    if (!file) {
      return res.status(400).json({ error: "Archivo no recibido" });
    }

    // Validar tipo de archivo (solo imágenes)
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"];

    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ error: "Formato de archivo no permitido. Solo se aceptan imágenes." });
    }

    // Procesar imagen con OCR
    const data = await ocrService.procesarImagen(file.path, tipo);
    res.json({ ok: true, data });
  } catch (err) {
    console.error("Error en procesarOCR:", err);
    res.status(500).json({ error: (err as Error).message });
  }
}
