import { prisma } from '../config/prisma';
import { determinarTurno } from '../utils/determinarTurno';
export class ReporteService {
    async procesarReporte(zDate, datos) {
        const { turno, fecha } = determinarTurno(zDate);
        const registro = await prisma.reporteZ.create({
            data: {
                fechaBase: fecha,
                turno,
                totalVentas: datos.totalVentas,
                fechaImpresion: zDate
            }
        });
        return registro;
    }
}
