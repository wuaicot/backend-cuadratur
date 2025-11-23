// src/application/parser/parsePlanilla.ts
import { ParsedPlanilla } from "../../ocr/types";

export function parsePlanilla(
  texto: string,
  tipo: "caja" | "cocina"
): ParsedPlanilla {
  const lineas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items = lineas.map((line) => {
    const parts = line.split(/\s+/);

    return {
      nombre: parts[0] || "",
      saldo: Number(parts[1]) || 0,
      entrada: Number(parts[2]) || 0,
      total: Number(parts[3]) || 0,
      venta: Number(parts[4]) || 0,
      falta: Number(parts[5]) || 0,
    };
  });

  return { tipo, fecha: new Date(), items };
}
