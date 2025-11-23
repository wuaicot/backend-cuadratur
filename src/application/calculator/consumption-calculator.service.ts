import { ParsedSheet } from "../parser/types";
import { CalculatedData } from "../../domain/calculated/calculated.entity";

export class ConsumptionCalculatorService {
  compute(sheet: ParsedSheet): CalculatedData {
    const results = sheet.rows.map((row) => ({
      producto: row.producto,
      cantidadTeorica: row.cantidad * 1.15, // Ej. +15% mermas
    }));

    return { results };
  }
}
