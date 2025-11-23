import { ParsedSheet, ParsedRow } from "./types";

export class ParserService {
  parseTextToSheet(text: string): ParsedSheet {
    const lines = text.split("\n").filter(Boolean);

    const rows: ParsedRow[] = lines.map((line) => {
      const parts = line.split(" ").filter(Boolean);

      return {
        producto: parts[0],
        cantidad: Number(parts[1] ?? 0),
        unidad: parts[2] ?? "UND",
      };
    });

    return { rows };
  }
}
