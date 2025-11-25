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

    if (!file?.buffer) {
      throw new Error("El archivo no contiene buffer. Revisa Multer memoryStorage.");
    }

    console.log(`[OCR] Procesando tipo='${tipo}' archivo='${file.originalname}'`);

    // 1. Pre-procesar imagen desde buffer → PNG limpio temporal
    const cleanedPath = await preprocessImageFromBuffer(
      file.buffer,
      file.originalname
    );

    console.log("[OCR] Ejecutando Tesseract sobre:", cleanedPath);

    // 2. OCR Tesseract
    const { data } = await Tesseract.recognize(cleanedPath, "spa", {
      logger: () => {}
    });

    console.log("[OCR] RAW TEXT:\n", data.text);

    const texto = data.text
      .replace(/[ \t]+/g, " ")
      .replace(/\r/g, "")
      .trim();

    console.log("[OCR] TEXTO NORMALIZADO:\n", texto);

    // 3. Elegir parser
    if (tipo === "reporteZ") {
      console.log("[OCR] Parser: Reporte Z");
      return parseReporteZ(texto);
    }

    console.log("[OCR] Parser: Planilla", tipo);
    return parsePlanilla(texto, tipo);
  }
}

export const ocrService = new OCRService();
