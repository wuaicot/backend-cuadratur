// src/api/cuadratur.controller.ts
import { Request, Response } from "express";
import { CuadraturOrchestrator } from "../application/cuadratur.orchestrator"; // Changed import

export class CuadraturController {
  private readonly orchestrator: CuadraturOrchestrator; // Declared as class property

  constructor() {
    this.orchestrator = new CuadraturOrchestrator(); // Instantiated in constructor
  }

  async analizar(req: Request, res: Response) {
    try {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const reporteZFile = files["reporteZ"]?.[0];
      const planillaCajaFile = files["planillaCaja"]?.[0];
      const planillaCocinaFile = files["planillaCocina"]?.[0];

      if (!reporteZFile || !planillaCajaFile || !planillaCocinaFile) {
        return res.status(400).json({
          error:
            "Debe enviar los tres archivos requeridos: reporteZ, planillaCaja y planillaCocina.",
        });
      }

      const result = await this.orchestrator.ejecutar({ // Changed to this.orchestrator
        files: {
          reporteZ: reporteZFile,
          planillaCaja: planillaCajaFile,
          planillaCocina: planillaCocinaFile,
        },
        usuario: "admin", // User handling will be addressed in a later phase
      });

      res.json(result);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido.";
      console.error("Error in CuadraturController.analizar:", err); // Log the actual error
      res.status(500).json({ error: "Ocurrió un error interno al procesar el análisis." }); // More robust error response
    }
  }

  async historial(req: Request, res: Response) {
    try {
      // This needs to be implemented properly, fetching from the database.
      // For now, it will return an empty array or handle through the orchestrator.
      // Assuming orchestrator.historial() now fetches from DB
      const history = await this.orchestrator.historial(); 
      res.json(history);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido.";
      console.error("Error in CuadraturController.historial:", err);
      res.status(500).json({ error: "Ocurrió un error interno al obtener el historial." });
    }
  }

  async obtener(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "El ID proporcionado no es un número válido." });
      }
      // Assuming orchestrator.obtenerAnalisis(id) now fetches from DB
      const analysis = await this.orchestrator.obtenerAnalisis(id);
      if (!analysis) {
        return res.status(404).json({ error: "Análisis no encontrado." });
      }
      res.json(analysis);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido.";
      console.error("Error in CuadraturController.obtener:", err);
      res.status(500).json({ error: "Ocurrió un error interno al obtener el análisis." });
    }
  }
}