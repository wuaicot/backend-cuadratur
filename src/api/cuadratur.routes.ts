// src/api/cuadratur.routes.ts
import { Router } from "express";
import multer from "multer";
import { CuadraturController } from "./cuadratur.controller";

const router = Router();
const controller = new CuadraturController();

// Configuración multer (acepta múltiples archivos con campos específicos)
const upload = multer({ storage: multer.memoryStorage() });

const fileFields = [
    { name: 'reporteZ', maxCount: 1 },
    { name: 'planillaCaja', maxCount: 1 },
    { name: 'planillaCocina', maxCount: 1 }
];

router.post("/analizar", upload.fields(fileFields), controller.analizar.bind(controller));
router.get("/historial", controller.historial.bind(controller));
router.get("/analisis/:id", controller.obtener.bind(controller));

export default router;
