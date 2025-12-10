import { createWorker } from "tesseract.js";
import { preprocessImageFromBuffer } from "./preprocessImage";
import { parsePlanilla } from "../application/parser/parsePlanilla";
import { parseReporteZ } from "../application/parser/parseReporteZ";
import { ParsedPlanilla, ParsedReporteZ, PlanillaCocinaParsed } from "./types";
import { PLANILLA_CONFIG, KNOWN_INGREDIENTS } from "../application/config/planilla-config";
import sharp from "sharp";

export class OCRService {
  async procesarImagen(
    file: Express.Multer.File,
    tipo: "caja" | "cocina" | "reporteZ"
  ): Promise<ParsedPlanilla | ParsedReporteZ | PlanillaCocinaParsed> {
    if (!file?.buffer) {
      throw new Error("El archivo no contiene buffer. Revisa Multer memoryStorage.");
    }

    console.log(`[OCR] Procesando tipo='${tipo}' archivo='${file.originalname}'`);

    const cleanedBuffer = await preprocessImageFromBuffer(file.buffer);

    if (tipo === "cocina") {
      console.log("[OCR] Procesando Planilla de Cocina con nueva lógica de cuadrícula dinámica.");
      return this.detectAndProcessGrids(cleanedBuffer);
    }

    const worker = await createWorker("spa");
    const { data } = await worker.recognize(cleanedBuffer);
    await worker.terminate();

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

  private async detectAndProcessGrids(
    imageBuffer: Buffer
  ): Promise<PlanillaCocinaParsed> {
    const results: PlanillaCocinaParsed = {};
    console.log("[OCR-GRID] Iniciando detección y procesamiento dinámico de cuadrículas...");

    const worker = await createWorker("spa");
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const imageWidth = metadata.width || PLANILLA_CONFIG.imageWidth;
    const imageHeight = metadata.height || PLANILLA_CONFIG.imageHeight;

    // New strategy: Process the image in horizontal strips to get all lines
    const allLines = [];
    const stripHeight = 200; // Process in 200px tall strips
    for (let y = 0; y < imageHeight; y += stripHeight) {
      const currentStripHeight = Math.min(stripHeight, imageHeight - y);
      const stripBuffer = await image.clone().extract({ left: 0, top: y, width: imageWidth, height: currentStripHeight }).toBuffer();
      const { data } = await worker.recognize(stripBuffer);
      if (data && data.lines) {
        // Adjust line coordinates to be relative to the full image
        for (const line of data.lines) {
          line.bbox.y0 += y;
          line.bbox.y1 += y;
        }
        allLines.push(...data.lines);
      }
    }

    const lines = allLines;
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      console.error("[OCR-GRID] Error: Tesseract no devolvió un array de líneas.");
      await worker.terminate();
      return results;
    }

    const detectedIngredients = [];
    // Find known ingredients in the OCR'd lines
    for (const line of lines) {
      for (const ingredient of KNOWN_INGREDIENTS) {
        if (line.text.toLowerCase().includes(ingredient.toLowerCase())) {
          detectedIngredients.push({ name: ingredient, bbox: line.bbox });
          // Basic deduplication
          break;
        }
      }
    }

    console.log(`[OCR-GRID] Ingredientes detectados:`, detectedIngredients.map(i => i.name));

    for (const detected of detectedIngredients) {
      const ingredientName = detected.name;
      results[ingredientName] = { INIC: [], ENTR: [], DEV: [], FIN: [] };
      
      const gridDef = PLANILLA_CONFIG.ingredientGridDefinitions[0]; // Use the first as a template
      const gridX = gridDef.x; // We assume X is constant for all grids
      const gridY = detected.bbox.y0; // Use the Y of the detected ingredient name as the anchor
      const gridWidth = gridDef.width;
      const gridHeight = gridDef.height;

      console.log(`[OCR-GRID] Procesando ingrediente: ${ingredientName} en Y=${gridY}`);

      for (const category in PLANILLA_CONFIG.categoryRowOffsets) {
        // @ts-ignore
        const categoryOffset = PLANILLA_CONFIG.categoryRowOffsets[category];
        const categoryY = gridY + (gridHeight * categoryOffset);

        for (const qtyLabel in PLANILLA_CONFIG.quantityColumnOffsets) {
          // @ts-ignore
          const qtyOffset = PLANILLA_CONFIG.quantityColumnOffsets[qtyLabel];
          const qtyX = gridX + (gridWidth * qtyOffset);

          const cellWidth = PLANILLA_CONFIG.cellWidth;
          const cellHeight = PLANILLA_CONFIG.cellHeight;

          const left = Math.round(qtyX - cellWidth / 2);
          const top = Math.round(categoryY - cellHeight / 2);
          const width = Math.round(cellWidth);
          const height = Math.round(cellHeight);

          try {
            const cellImageBuffer = await image.clone().extract({ left, top, width, height }).toBuffer();
            const { data: cellOcrData } = await worker.recognize(cellImageBuffer);
            
            const isMarked = cellOcrData.text && cellOcrData.text.trim().length > 0;
            
            if (isMarked) {
              console.log(`[OCR-GRID] Celda MARCADA para ${ingredientName} - ${category} - Cantidad: ${qtyLabel}. Texto: "${cellOcrData.text.trim()}"`);
              (results[ingredientName][category as keyof PlanillaCocinaParsed[string]] as number[]).push(
                parseInt(qtyLabel)
              );
            }
          } catch(e) {
            console.error(`[OCR-GRID] Error procesando celda para ${ingredientName} en ${category} - ${qtyLabel}. Coords: l:${left}, t:${top}, w:${width}, h:${height}. Error: ${e}`);
          }
        }
      }
    }

    await worker.terminate();
    console.log("[OCR-GRID] Resultados finales del procesamiento de la cuadrícula:");
    console.log(JSON.stringify(results, null, 2));

    return results;
  }
}

export const ocrService = new OCRService();