// src/ocr/preprocessImage.ts
import sharp from "sharp";

/**
 * Preprocesa una imagen desde un Buffer y devuelve un Buffer optimizado para OCR.
 * NO usa archivos temporales.
 * Totalmente compatible con OCRService.procesarImagen().
 */
export async function preprocessImageFromBuffer(
  buffer: Buffer
): Promise<Buffer> {
  try {
    const input = sharp(buffer);
    const metadata = await input.metadata();

    // Upscaling si la imagen es pequeña
    const needsUpscale = (metadata.width ?? 0) < 1000;

    let processed = input;

    if (needsUpscale) {
      processed = processed.resize({
        width: 1500,
        kernel: sharp.kernel.lanczos3,
      });
    }

    // Limpieza óptima para texto del Reporte Z y Planillas
    processed = processed
      .normalize()      // Mejora contraste global
      .gamma(1.2)       // Aclara zonas oscuras
      .grayscale()      // Convierte a blanco y negro
      .median(1)        // Reduce puntos de ruido
      .linear(1.1, -20) // Ajuste de brillo/contraste fino
      .threshold(128);  // Binarización → Tesseract eficiente

    // Salida final para Tesseract
    return await processed.toBuffer();

  } catch (error) {
    console.error("[OCR] Error al preprocesar:", error);
    throw new Error("Error interno al preprocesar imagen.");
  }
}
