// src/ocr/types.ts

export interface ParsedPlanillaItem {
  nombre: string;
  saldo: number;
  entrada: number;
  total: number;
  venta: number;
  falta: number;
}

export interface ParsedPlanilla {
  tipo: "caja" | "cocina";
  fecha: Date;
  items: ParsedPlanillaItem[];
}

export interface ParsedReporteZVenta {
  codigo: string;
  descripcion: string;
  cantidad: number;
}

export interface ParsedReporteZ {
  fecha: Date;
  ventas: ParsedReporteZVenta[];
}
