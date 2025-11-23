import { AnalisisService } from '../domain/analysis/analisis.service';
import { OCRService } from '../ocr/ocr.service';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { ParsedPlanilla, ParsedReporteZ } from '../ocr/types'; // Import ParsedPlanilla and ParsedReporteZ

type OcrReturnType<T extends 'caja' | 'cocina' | 'reporteZ'> =
    T extends 'reporteZ' ? ParsedReporteZ : ParsedPlanilla;

class HistoryService {
    private pasos: Array<{ etiqueta: string; data: any; fecha: string }> = [];

    registrarPaso(etiqueta: string, data: any) {
        this.pasos.push({ etiqueta, data, fecha: new Date().toISOString() });
    }

    obtenerHistorial() {
        return this.pasos.slice();
    }
}

export class CuadraturOrchestrator {
    private analisisService: AnalisisService;
    private historyService: HistoryService;
    private ocrService: OCRService;

    constructor() {
        this.analisisService = new AnalisisService();
        this.historyService  = new HistoryService();
        this.ocrService = new OCRService();
    }

    private async _processSingleFile<T extends 'caja' | 'cocina' | 'reporteZ'>(
        file: Express.Multer.File,
        tipo: T
    ): Promise<OcrReturnType<T>> {
        let tempFilePath: string | undefined;
        try {
            const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
            const uploadsDir = path.join(process.cwd(), 'uploads');
            await fs.mkdir(uploadsDir, { recursive: true });
            tempFilePath = path.join(uploadsDir, fileName);

            await fs.writeFile(tempFilePath, file.buffer);
            this.historyService.registrarPaso(`ARCHIVO_TEMPORAL_CREADO_${tipo.toUpperCase()}`, { path: tempFilePath });

            const ocrResult = await this.ocrService.procesarImagen(tempFilePath, tipo);
            this.historyService.registrarPaso(`OCR_COMPLETADO_${tipo.toUpperCase()}`, { ocrResult });

            return ocrResult as OcrReturnType<T>; // Type assertion here
        } finally {
            if (tempFilePath) {
                try {
                    await fs.unlink(tempFilePath);
                    this.historyService.registrarPaso(`ARCHIVO_TEMPORAL_ELIMINADO_${tipo.toUpperCase()}`, { path: tempFilePath });
                } catch (unlinkError) {
                    console.error(`Error al eliminar archivo temporal para ${tipo}:`, unlinkError);
                }
            }
        }
    }

    async ejecutar(input: {
        files: {
            reporteZ: Express.Multer.File;
            planillaCaja: Express.Multer.File;
            planillaCocina: Express.Multer.File;
        },
        usuario: string
    }) {
        this.historyService.registrarPaso("INICIO_CUADRATURA_MULTIPLE", input);
        const { files, usuario } = input;

        try {
            // Procesar los tres archivos en paralelo
            const [reporteZData, planillaCajaData, planillaCocinaData] = await Promise.all([
                this._processSingleFile(files.reporteZ, 'reporteZ'),
                this._processSingleFile(files.planillaCaja, 'caja'),
                this._processSingleFile(files.planillaCocina, 'cocina')
            ]);

            this.historyService.registrarPaso("OCR_TODOS_COMPLETADOS", { reporteZData, planillaCajaData, planillaCocinaData });

            // DEBUG: Imprimir resultados del OCR
            console.log("--- DEBUG: Resultados del OCR ---");
            console.log("Reporte Z:", JSON.stringify(reporteZData, null, 2));
            console.log("Planilla Caja:", JSON.stringify(planillaCajaData, null, 2));
            console.log("Planilla Cocina:", JSON.stringify(planillaCocinaData, null, 2));
            console.log("---------------------------------");

            // Ejecutar el análisis con todos los datos del OCR
            const analisisResultado = await this.analisisService.ejecutarAnalisis({
                ocrData: {
                    reporteZ: reporteZData as ParsedReporteZ,
                    planillaCaja: planillaCajaData as ParsedPlanilla,
                    planillaCocina: planillaCocinaData as ParsedPlanilla
                }
            });
            this.historyService.registrarPaso("ANALISIS_COMPLETO_OK", analisisResultado);

            // DEBUG: Imprimir resultado final del análisis
            console.log("--- DEBUG: Resultado del Análisis ---");
            console.log(JSON.stringify(analisisResultado, null, 2));
            console.log("------------------------------------");

            // Devolver directamente la respuesta formateada para el frontend
            return analisisResultado.frontendResponse;

        } catch (error) {
            this.historyService.registrarPaso("ERROR_GENERAL_CUADRATURA", { mensaje: (error as Error).message });
            console.error("Error en CuadraturOrchestrator.ejecutar:", error);
            throw error;
        }
    }
}