export interface ParsedGenericRow {
  producto: string;
  cantidad: number;
  unidad: string;
}

export interface ParsedGenericSheet {
  rows: ParsedGenericRow[];
}

export class ParserService {
  parseTextToSheet(text: string): ParsedGenericSheet {
    const lines = text.split("\n").filter(Boolean);

    const rows: ParsedGenericRow[] = lines.map(line => {
      const parts = line.split(" ").filter(Boolean);

      return {
        producto: parts[0],
        cantidad: Number(parts[1] ?? 0),
        unidad: parts[2] ?? "UND"
      };
    });

    return { rows };
  }
}
