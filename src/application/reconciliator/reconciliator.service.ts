import { CalculatedData } from "../calculator/consumption-calculator.service";

export interface ReconciledItem {
  producto: string;
  diferencia: number;
}

export interface ReconciledData {
  reconciled: ReconciledItem[];
}

export class ReconciliatorService {
  reconcile(theoretical: CalculatedData): ReconciledData {
    return {
      reconciled: theoretical.results.map(r => ({
        producto: r.producto,
        diferencia: 0 // placeholder hasta que tengamos existencias reales
      }))
    };
  }
}
