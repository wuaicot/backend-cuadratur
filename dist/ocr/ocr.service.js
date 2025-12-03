import Tesseract from "tesseract.js";
import { preprocessImageFromBuffer } from "./preprocessImage";
import { parsePlanilla } from "../application/parser/parsePlanilla";
import { parseReporteZ } from "../application/parser/parseReporteZ";
export class OCRService {
    async procesarImagen(file, tipo) {
        if (!file?.buffer) {
            throw new Error("El archivo no contiene buffer. Revisa Multer memoryStorage.");
        }
        console.log(`[OCR] Procesando tipo='${tipo}' archivo='${file.originalname}'`);
        const cleanedBuffer = await preprocessImageFromBuffer(file.buffer);
        console.log("[OCR] Ejecutando Tesseract sobre BUFFER");
        const { data } = await Tesseract.recognize(cleanedBuffer, "spa", {
            logger: () => { },
        });
        console.log("[OCR] RAW TEXT:\n", data.text);
        const texto = data.text
            .replace(/[ \t]+/g, " ")
            .replace(/\r/g, "")
            .trim();
        console.log("[OCR] TEXTO NORMALIZADO:\n", texto);
        if (tipo === "reporteZ") {
            console.log("[OCR] Parser: Reporte Z");
            return parseReporteZ(texto);
        }
        console.log("[OCR] Parser: Planilla", tipo);
        return parsePlanilla(texto, tipo);
    }
}
export const ocrService = new OCRService();
