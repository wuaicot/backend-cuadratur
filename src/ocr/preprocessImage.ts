import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Preprocesa una imagen desde un Buffer y devuelve una ruta temporal
 * lista para ser procesada por Tesseract.
 */
export async function preprocessImageFromBuffer(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  const tempName = `${Date.now()}-${randomUUID()}-${originalName}`;
  const tempPath = path.join("/tmp", tempName);
  const outPath = tempPath.replace(path.extname(tempPath), "_cleaned.png");

  // Guardar imagen original temporal
  await fs.writeFile(tempPath, buffer);

  // Procesamiento Sharp
  const inputImage = sharp(buffer);
  const metadata = await inputImage.metadata();
  const needsUpscale = (metadata.width ?? 0) < 1000;

  let processed = inputImage;

  if (needsUpscale) {
    processed = processed.resize({
      width: 1500,
      kernel: "lanczos3"
    });
  }

  processed = processed
    .normalize()
    .gamma(1.2)
    .grayscale()
    .median(1)
    .linear(1.1, -20)
    .threshold(128);

  // Imagen procesada → disco
  await processed.toFile(outPath);

  return outPath;
}
