import { ParsedReporteZ } from "../../ocr/types";

export interface CalculatedItem {
  producto: string;
  cantidadTeorica: number;
}

export interface CalculatedData {
  results: CalculatedItem[];
}

export class ConsumptionCalculatorService {
  compute(reporteZ: ParsedReporteZ): CalculatedData {
    const results = reporteZ.ventas.map(v => ({
      producto: v.descripcion,
      cantidadTeorica: v.cantidad * 1.15 // ejemplo mermas +15%
    }));

    return { results };
  }
}
