import levenshtein from "js-levenshtein";
/**
 * Normaliza la cadena para evitar problemas
 */
function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // elimina acentos
        .replace(/[^a-z0-9]/g, " "); // elimina rarezas del OCR
}
/**
 * Devuelve el mejor match según similitud.
 * threshold: mínimo score aceptable (0–1), 1 es match perfecto.
 */
export function fuzzyMatch(input, candidates, threshold = 0.45) {
    const term = normalize(input);
    let best = { key: "", score: 0 };
    for (const c of candidates) {
        const candidate = normalize(c);
        const dist = levenshtein(term, candidate);
        const maxLen = Math.max(term.length, candidate.length);
        const similarity = 1 - dist / maxLen;
        if (similarity > best.score) {
            best = { key: c, score: similarity };
        }
    }
    return best.score >= threshold ? best : null;
}
