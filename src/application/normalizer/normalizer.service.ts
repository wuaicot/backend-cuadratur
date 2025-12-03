import { NormalizedData } from "../../domain/normalized";

export class NormalizerService {
  normalize(rawText: string): NormalizedData {
    const cleaned = rawText
      .replace(/\s+/g, " ")
      .replace(/[^0-9A-Za-zÁÉÍÓÚÑ\-., ]/g, "")
      .trim();

    return { cleaned };
  }
}
