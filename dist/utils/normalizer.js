// ------------------------------------------------------
// NORMALIZADOR DE CAMPOS NUMÉRICOS Y TEXTO DE PLANILLA
// ------------------------------------------------------
export function normalizeNumber(raw) {
    if (raw === null || raw === undefined)
        return 0;
    const text = String(raw).trim();
    if (text === "" || text.toLowerCase() === "o")
        return 0;
    // Remueve caracteres no numéricos
    const cleaned = text.replace(/[^\d\-]/g, "");
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
}
export function normalizeText(raw) {
    if (!raw)
        return "";
    return String(raw).trim();
}
// Valida si una fila es sospechosa (útil para interfaz de auditoría)
export function isRowSuspicious(total, saldoInicial, entrada, devolucion) {
    const esperado = saldoInicial + entrada + devolucion;
    return esperado !== total;
}
