import { Router } from 'express';
import { ReporteController } from '../controllers/reporte.controller';
const router = Router();
const controller = new ReporteController();
router.post('/procesar', controller.procesar);
export default router;
