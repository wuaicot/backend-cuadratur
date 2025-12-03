import { DictionaryService } from "../dictionary/dictionary.service";
export class ParserService {
    constructor() {
        this.dict = new DictionaryService();
    }
    parsePlanilla(raw, tipo) {
        return {
            tipo,
            fecha: raw.fecha || new Date(),
            items: raw.items.map((it) => ({
                nombre: this.dict.matchBebestible(it.nombre) || this.dict.matchIngrediente(it.nombre),
                saldo: Number(it.saldo || 0),
                entrada: Number(it.entrada || 0),
                total: Number(it.total || 0),
            })),
        };
    }
    parseReporteZ(raw) {
        return {
            fecha: raw.fecha || new Date(),
            ventas: raw.ventas.map((v) => ({
                codigo: v.codigo,
                descripcion: v.descripcion,
                cantidad: Number(v.cantidad || 0),
            })),
        };
    }
}
