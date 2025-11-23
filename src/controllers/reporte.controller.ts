import { Request, Response } from 'express';
import { ReporteService } from '../services/reporte.service';

const service = new ReporteService();

export class ReporteController {
  async procesar(req: Request, res: Response) {
    const { zDate, totalVentas } = req.body;
    const resultado = await service.procesarReporte(new Date(zDate), { totalVentas });
    res.json(resultado);
  }
}
