import { prisma } from '../config/prisma';
import { determinarTurno } from '../utils/determinarTurno';

export class ReporteService {
  async procesarReporte(zDate: Date, datos: { totalVentas: number }) {
    const { turno, fecha } = determinarTurno(zDate);

    const registro = await (prisma as any).reporteZ.create({
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
