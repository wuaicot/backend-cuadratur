export class NormalizerService {
    normalize(rawText) {
        const cleaned = rawText
            .replace(/\s+/g, " ")
            .replace(/[^0-9A-Za-zÁÉÍÓÚÑ\-., ]/g, "")
            .trim();
        return { cleaned };
    }
}
