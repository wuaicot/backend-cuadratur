// src/ocr/preprocessImage.ts
import sharp from "sharp";

/**
 * Preprocesa una imagen desde un Buffer y devuelve otro Buffer
 * totalmente procesado para que Tesseract lo procese directamente.
 * SIN archivos temporales → 0% ENOENT.
 */
export async function preprocessImageFromBuffer(
  buffer: Buffer
): Promise<Buffer> {
  const input = sharp(buffer);
  const metadata = await input.metadata();

  const needsUpscale = (metadata.width ?? 0) < 1000;

  let processed = input;

  if (needsUpscale) {
    processed = processed.resize({
      width: 1500,
      kernel: sharp.kernel.lanczos3,
    });
  }

  processed = processed
    .normalize()
    .gamma(1.2)
    .grayscale()
    .median(1)
    .linear(1.1, -20)
    .threshold(128);

  // DEVOLVER BUFFER → no escribir a disco nunca más
  const outputBuffer = await processed.toBuffer();
  return outputBuffer;
}
