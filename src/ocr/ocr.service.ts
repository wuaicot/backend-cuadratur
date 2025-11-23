import Tesseract from "tesseract.js";
import { preprocessImage } from "./preprocess";
import { ParsedPlanilla, ParsedReporteZ } from "./types";

export class OCRService {
  async procesarImagen(filePath: string, tipo: "caja" | "cocina" | "reporteZ") {
    const preprocessedPath = await preprocessImage(filePath);

    const { data } = await Tesseract.recognize(preprocessedPath, "spa");

    // Mantiene saltos de línea y solo normaliza espacios dentro de líneas
    const texto = data.text
      .replace(/[ \t]+/g, " ")   // normaliza espacios
      .replace(/\r/g, "")        // elimina retorno de carro
      .trim();

    console.log("OCR RAW:\n", data.text);
    console.log("OCR NORMALIZADO:\n", texto);

    if (tipo === "reporteZ") {
      return this.parseReporteZ(texto);
    }

    return this.parsePlanilla(texto, tipo);
  }

  private parsePlanilla(texto: string, tipo: "caja" | "cocina"): ParsedPlanilla {
    // Mantiene estructura del documento
    const lineas = texto.split("\n").map(l => l.trim()).filter(Boolean);

    const items = lineas.map((line) => {
      // Asegura que no colapse la línea entera en caso de OCR defectuoso
      const parts = line.split(/\s+/);

      return {
        nombre: parts[0] || "",
        saldo: Number(parts[1]) || 0,
        entrada: Number(parts[2]) || 0,
        total: Number(parts[3]) || 0,
        venta: Number(parts[4]) || 0,
        falta: Number(parts[5]) || 0,
      };
    });

    return { tipo, fecha: new Date(), items };
  }

  private parseReporteZ(texto: string): ParsedReporteZ {
    const lineas = texto.split("\n").map(l => l.trim()).filter(Boolean);

    const ventas = lineas.flatMap((line) => {
      const match = line.match(/(\d+)\s+([A-Z0-9\s]+)\s+(\d+)/i);
      if (!match) return [];

      return [
        {
          codigo: match[1],
          descripcion: match[2].trim(),
          cantidad: Number(match[3]),
        },
      ];
    });

    return { fecha: new Date(), ventas };
  }
}
