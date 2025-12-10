export interface ParsedPlanilla {
  tipo: "caja" | "cocina";
  fecha: Date;
  items: {
    nombre: string;
    saldo: number;
    entrada: number;
    total: number;
    venta: number;
    falta: number;
  }[];
}

export interface ParsedReporteZ {
  fecha: Date;
  ventas: {
    codigo: string;
    descripcion: string;
    cantidad: number;
  }[];
}

export interface PlanillaCocinaParsed {
  [ingredientName: string]: {
    INIC: number[];
    ENTR: number[];
    DEV: number[];
    FIN: number[];
  };
}
