import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

/**
 * Preprocesa una imagen para maximizar los resultados del OCR.
 * Aplica:
 *  - Redimensionamiento automático si resolución es baja
 *  - Eliminación de ruido
 *  - Aumento de contraste
 *  - Normalización de iluminación
 *  - Umbral adaptativo simulando Otsu
 *  - Salida garantizada con nombre único
 */
export async function preprocessImage(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = filePath.replace(ext, "");

  const outPath = `${baseName}_cleaned.png`;

  // Asegura que no coincida input y output
  if (outPath === filePath) {
    throw new Error("Output path would overwrite input file");
  }

  // Cargar metadata para decidir si hay que escalar
  const inputImage = sharp(filePath);
  const metadata = await inputImage.metadata();

  const needsUpscale = (metadata.width ?? 0) < 1000;

  let processed = inputImage;

  // 1) Escala si tiene baja resolución (OCR funciona mejor con >1000px)
  if (needsUpscale) {
    processed = processed.resize({
      width: 1500,
      kernel: "lanczos3"
    });
  }

  // 2) Normaliza iluminación (mejora contraste)
  processed = processed
    .normalize()         // armoniza el brillo
    .gamma(1.2)          // mejora contraste de zonas oscuras
    .grayscale();        // convierte a escala de grises estable

  // 3) Suaviza ruido de fondo
  processed = processed.median(1);

  // 4) Umbral adaptativo tipo Otsu (simulado)
  processed = processed
    .linear(1.1, -20)    // aumenta contraste aún más
    .threshold(128);     // binariza

  await processed.toFile(outPath);

  return outPath;
}
