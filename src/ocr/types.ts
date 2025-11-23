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
