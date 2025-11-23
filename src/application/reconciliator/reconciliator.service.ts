import { CalculatedData } from "../../domain/calculated/calculated.entity";
import { ReconciledData } from "../../domain/reconciled/reconciled.entity";

export class ReconciliatorService {
  reconcile(theoretical: CalculatedData): ReconciledData {
    return {
      reconciled: theoretical.results.map((r) => ({
        producto: r.producto,
        diferencia: r.cantidadTeorica - r.cantidadTeorica, // placeholder
      })),
    };
  }
}
