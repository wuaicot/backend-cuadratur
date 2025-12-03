export class ReconciliatorService {
    reconcile(theoretical) {
        return {
            reconciled: theoretical.results.map(r => ({
                producto: r.producto,
                diferencia: 0 // placeholder hasta que tengamos existencias reales
            }))
        };
    }
}
