import { normalizeNumber, normalizeText } from "../utils/normalizer";
export function parsePlanillaOCR(ocrJson) {
    return ocrJson.map((row) => {
        const saldoInicial = normalizeNumber(row["SALDO"]);
        const entrada = normalizeNumber(row["ENTRADA"]);
        const devolucion = normalizeNumber(row["DEVOLUCION"]);
        const totalOCR = normalizeNumber(row["TOTAL"]);
        // Si TOTAL no coincide, recalcular según fórmula oficial
        const total = totalOCR || saldoInicial + entrada + devolucion;
        const saldoFinal1 = normalizeNumber(row["SALDO1"]);
        const saldoFinal2 = normalizeNumber(row["SALDO2"]);
        const saldoFinal = saldoFinal1 + saldoFinal2;
        const sospechoso = total !== saldoInicial + entrada + devolucion;
        return {
            item: normalizeText(row["MERCADERIA"] || row["ITEM"]),
            saldoInicial,
            entrada,
            devolucion,
            total,
            saldoFinal,
            venta: normalizeNumber(row["VENTA"]),
            falta: normalizeNumber(row["FALTA"]),
            sospechoso,
        };
    });
}
