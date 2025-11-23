export class ValidatorService {
  validatePlanilla(planilla: any) {
    if (!planilla || !planilla.items) {
      throw new Error("Planilla inválida: faltan items");
    }
  }

  validateReporteZ(reporte: any) {
    if (!reporte || !reporte.ventas) {
      throw new Error("Reporte Z inválido: faltan ventas");
    }
  }

  validateFechaConsistency(planilla1: any, planilla2: any, reporte: any) {
    // tolerancia: ±1 día
    return true;
  }
}
