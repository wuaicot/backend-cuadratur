import { normalizeNumber, normalizeText } from "../utils/normalizer";

export type CocinaRow = {
  item: string;
  saldoInicial: number;
  entrada: number;
  devolucion: number;
  total: number;
  saldoFinal: number;  // suma planchero1 + planchero2 si aparecen separados
  venta?: number;
  falta?: number;
  sospechoso?: boolean;
};

export function parsePlanillaOCR(ocrJson: any[]): CocinaRow[] {
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
