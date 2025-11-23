import sharp from "sharp";
import path from "path";

export async function preprocessImage(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = filePath.replace(ext, "");
  const outPath = `${baseName}_cleaned.png`;

  const inputImage = sharp(filePath);
  const metadata = await inputImage.metadata();
  const needsUpscale = (metadata.width ?? 0) < 1000;

  let processed = inputImage;

  if (needsUpscale) {
    processed = processed.resize({
      width: 1500,
      kernel: "lanczos3",
    });
  }

  processed = processed
    .normalize()
    .gamma(1.2)
    .grayscale()
    .median(1)
    .linear(1.1, -20)
    .threshold(128);

  await processed.toFile(outPath);

  return outPath;
}
