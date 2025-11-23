import { Request, Response } from "express";

let CuadraturOrchestrator: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CuadraturOrchestrator = require("../application/cuadratur/cuadratur.orchestrator")
    .CuadraturOrchestrator;
} catch (error) {
  console.error("Error CRÍTICO: No se pudo cargar CuadraturOrchestrator. Usando implementación mock.", error);
  CuadraturOrchestrator = class {
    async ejecutar(_: any) {
      return { fecha: new Date().toISOString(), items: [] };
    }
    historial() {
      return [];
    }
    obtenerAnalisis(_: number) {
      return null;
    }
  };
}

const orchestrator = new CuadraturOrchestrator();

export class CuadraturController {
  async analizar(req: Request, res: Response) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const reporteZFile = files['reporteZ']?.[0];
      const planillaCajaFile = files['planillaCaja']?.[0];
      const planillaCocinaFile = files['planillaCocina']?.[0];

      if (!reporteZFile || !planillaCajaFile || !planillaCocinaFile) {
        return res.status(400).json({
          error: "Debe enviar los tres archivos requeridos: reporteZ, planillaCaja y planillaCocina."
        });
      }

      const result = await orchestrator.ejecutar({
        files: {
          reporteZ: reporteZFile,
          planillaCaja: planillaCajaFile,
          planillaCocina: planillaCocinaFile,
        },
        usuario: "admin",
      });

      res.json(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido.";
      res.status(400).json({ error: errorMessage });
    }
  }

  async historial(_: Request, res: Response) {
    res.json(orchestrator.historial());
  }

  async obtener(req: Request, res: Response) {
    const id = Number(req.params.id);
    res.json(orchestrator.obtenerAnalisis(id));
  }
}
