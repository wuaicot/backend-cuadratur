import { BEBESTIBLES, MENUS, INGREDIENTES_MASTER } from "../../data/inventario";
import Fuse from "fuse.js";

export class DictionaryService {
  private bebidaFuse: Fuse<any>;
  private ingredienteFuse: Fuse<any>;

  constructor() {
    this.bebidaFuse = new Fuse(
      Object.values(BEBESTIBLES).map((b) => ({ nombre: b.nombre })),
      { keys: ["nombre"], threshold: 0.3 }
    );

    this.ingredienteFuse = new Fuse(
      Object.values(INGREDIENTES_MASTER).map((i) => ({ nombre: i.nombre })),
      { keys: ["nombre"], threshold: 0.3 }
    );
  }

  normalize(str: string) {
    return (str || "").toString().trim().toLowerCase();
  }

  /** Retorna nombre corregido según inventario */
  matchBebestible(nombreOCR: string) {
    const search = this.bebidaFuse.search(nombreOCR);
    if (search.length === 0) return nombreOCR;
    return search[0].item.nombre;
  }

  matchIngrediente(nombreOCR: string) {
    const search = this.ingredienteFuse.search(nombreOCR);
    if (search.length === 0) return nombreOCR;
    return search[0].item.nombre;
  }

  isBebestible(nombre: string) {
    const n = this.normalize(nombre);
    return Object.values(BEBESTIBLES).some(b => this.normalize(b.nombre) === n);
  }

  isIngrediente(nombre: string) {
    const n = this.normalize(nombre);
    return Object.values(INGREDIENTES_MASTER).some(i => this.normalize(i.nombre) === n);
  }
}
