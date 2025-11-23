import { DictionaryService } from "../dictionary/dictionary.service";

export class ParserService {
  private dict = new DictionaryService();

  parsePlanilla(raw: any, tipo: "caja" | "cocina") {
    return {
      tipo,
      fecha: raw.fecha || new Date(),
      items: raw.items.map((it: any) => ({
        nombre: this.dict.matchBebestible(it.nombre) || this.dict.matchIngrediente(it.nombre),
        saldo: Number(it.saldo || 0),
        entrada: Number(it.entrada || 0),
        total: Number(it.total || 0),
      })),
    };
  }

  parseReporteZ(raw: any) {
    return {
      fecha: raw.fecha || new Date(),
      ventas: raw.ventas.map((v: any) => ({
        codigo: v.codigo,
        descripcion: v.descripcion,
        cantidad: Number(v.cantidad || 0),
      })),
    };
  }
}
