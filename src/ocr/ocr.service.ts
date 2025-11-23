// src/ocr/ocr.service.ts
import Tesseract from "tesseract.js";
import { preprocessImage } from "./preprocessImage"; // ahora sí ruta correcta
import { parsePlanilla } from "../application/parser/parsePlanilla";
import { parseReporteZ } from "../application/parser/parseReporteZ";

import { ParsedPlanilla, ParsedReporteZ } from "./types";

export class OCRService {
  async procesarImagen(
    filePath: string,
    tipo: "caja" | "cocina" | "reporteZ"
  ): Promise<ParsedPlanilla | ParsedReporteZ> {

    console.log(`[OCR] Iniciando procesamiento para tipo='${tipo}' en:`, filePath);

    // 1. Preprocesamiento (convierte a PNG + limpia + normaliza)
    const preprocessedPath = await preprocessImage(filePath);

    console.log("[OCR] Ejecutando Tesseract sobre:", preprocessedPath);

    // 2. OCR con Tesseract
    const { data } = await Tesseract.recognize(preprocessedPath, "spa", {
      logger: () => {}
    });

    // Texto RAW directo del OCR
    console.log("[OCR] Texto RAW obtenido:\n", data.text);

    // 3. Normalización para evitar errores en el parser
    const texto = data.text
      .replace(/[ \t]+/g, " ") // normaliza espacios múltiples
      .replace(/\r/g, "")      // limpia caracteres invisibles
      .trim();

    console.log("[OCR] Texto NORMALIZADO:\n", texto);

    // 4. Dispatch según tipo de documento
    if (tipo === "reporteZ") {
      console.log("[OCR] Enviando texto al parser de Reporte Z");
      return parseReporteZ(texto);
    }

    console.log("[OCR] Enviando texto al parser de Planilla:", tipo);
    return parsePlanilla(texto, tipo);
  }
}

export const ocrService = new OCRService();
