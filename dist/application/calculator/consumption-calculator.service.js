export class ConsumptionCalculatorService {
    compute(reporteZ) {
        const results = reporteZ.ventas.map(v => ({
            producto: v.descripcion,
            cantidadTeorica: v.cantidad * 1.15 // ejemplo mermas +15%
        }));
        return { results };
    }
}
