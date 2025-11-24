import Tesseract from "tesseract.js";
import { preprocessImageFromBuffer } from "./preprocessImage";
import { parsePlanilla } from "../application/parser/parsePlanilla";
import { parseReporteZ } from "../application/parser/parseReporteZ";

import { ParsedPlanilla, ParsedReporteZ } from "./types";

export class OCRService {
  async procesarImagen(
    file: Express.Multer.File,
    tipo: "caja" | "cocina" | "reporteZ"
  ): Promise<ParsedPlanilla | ParsedReporteZ> {

    console.log(`[OCR] Iniciando procesamiento para tipo='${tipo}' - archivo=${file.originalname}`);

    // 1. Preprocesamiento desde Buffer → PNG temporal
    const cleanedPath = await preprocessImageFromBuffer(file.buffer, file.originalname);

    console.log("[OCR] Ejecutando Tesseract sobre:", cleanedPath);

    // 2. OCR con Tesseract
    const { data } = await Tesseract.recognize(cleanedPath, "spa", {
      logger: () => {}
    });

    console.log("[OCR] Texto RAW obtenido:\n", data.text);

    // 3. Normalización antes de enviarlo al parser
    const texto = data.text
      .replace(/[ \t]+/g, " ")
      .replace(/\r/g, "")
      .trim();

    console.log("[OCR] Texto NORMALIZADO:\n", texto);

    // 4. Envío al parser correspondiente
    if (tipo === "reporteZ") {
      console.log("[OCR] Enviando texto al parser de Reporte Z");
      return parseReporteZ(texto);
    }

    console.log("[OCR] Enviando texto al parser de Planilla:", tipo);
    return parsePlanilla(texto, tipo);
  }
}

export const ocrService = new OCRService();
