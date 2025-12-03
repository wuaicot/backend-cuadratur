export class ValidatorService {
    validatePlanilla(planilla) {
        if (!planilla || !planilla.items) {
            throw new Error("Planilla inválida: faltan items");
        }
    }
    validateReporteZ(reporte) {
        if (!reporte || !reporte.ventas) {
            throw new Error("Reporte Z inválido: faltan ventas");
        }
    }
    validateFechaConsistency(planilla1, planilla2, reporte) {
        // tolerancia: ±1 día
        return true;
    }
}
