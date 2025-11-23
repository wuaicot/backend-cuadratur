// src/application/parser/parseReporteZ.ts
import { ParsedReporteZ } from "../../ocr/types";

export function parseReporteZ(texto: string): ParsedReporteZ {
  const lineas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const ventas = lineas.flatMap((line) => {
    const match = line.match(/(\d+)\s+([A-Z0-9\s]+)\s+(\d+)/i);
    if (!match) return [];

    return [
      {
        codigo: match[1],
        descripcion: match[2].trim(),
        cantidad: Number(match[3]),
      },
    ];
  });

  return { fecha: new Date(), ventas };
}
