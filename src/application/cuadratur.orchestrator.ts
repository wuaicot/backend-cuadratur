import { OCRService } from "../ocr/ocr.service";
import { NormalizerService } from "./normalizer/normalizer.service";
import { ParserService } from "./parser/parser.service";
import { ConsumptionCalculatorService } from "./calculator/consumption-calculator.service";
import { ReconciliatorService } from "./reconciliator/reconciliator.service";

export class CuadraturOrchestrator {
  private readonly ocr: OCRService;
  private readonly normalizer: NormalizerService;
  private readonly parser: ParserService;
  private readonly calculator: ConsumptionCalculatorService;
  private readonly reconciliator: ReconciliatorService;

  constructor() {
    this.ocr = new OCRService();
    this.normalizer = new NormalizerService();
    this.parser = new ParserService();
    this.calculator = new ConsumptionCalculatorService();
    this.reconciliator = new ReconciliatorService();
  }

  /**
   * Método que realmente necesita el controller.
   * Ejecuta el OCR y análisis de los 3 archivos.
   */
  async ejecutar(params: {
    files: {
      reporteZ: Express.Multer.File;
      planillaCaja: Express.Multer.File;
      planillaCocina: Express.Multer.File;
    };
    usuario: string;
  }) {
    const { reporteZ, planillaCaja, planillaCocina } = params.files;

    const toBase64 = (file: Express.Multer.File) =>
      file.buffer.toString("base64");

    const z = await this.processImage(toBase64(reporteZ), "reporteZ");
    const caja = await this.processImage(toBase64(planillaCaja), "caja");
    const cocina = await this.processImage(toBase64(planillaCocina), "cocina");

    return {
      fecha: new Date().toISOString(),
      items: [
        { tipo: "reporteZ", data: z },
        { tipo: "caja", data: caja },
        { tipo: "cocina", data: cocina },
      ],
      usuario: params.usuario,
    };
  }

  /**
   * Pipeline interno: OCR → normalizar → parsear → calcular → reconciliar
   */
  async processImage(base64: string, tipo: "caja" | "cocina" | "reporteZ") {
    const ocrResult = await this.ocr.procesarImagen(base64, tipo);

    const rawText =
      typeof ocrResult === "string" ? ocrResult : JSON.stringify(ocrResult);

    const normalized =
      this.normalizer.normalize(rawText) ?? { cleaned: rawText };
    if (!normalized.cleaned) normalized.cleaned = rawText;

    const parsed =
      this.parser.parseTextToSheet(normalized.cleaned) ?? { rows: [] };
    if (!Array.isArray(parsed.rows)) parsed.rows = [];

    const calculated = this.calculator.compute(parsed) ?? { results: [] };
    if (!Array.isArray(calculated.results)) calculated.results = [];

    const reconciled =
      this.reconciliator.reconcile(calculated) ?? { reconciled: [] };
    if (!Array.isArray(reconciled.reconciled)) reconciled.reconciled = [];

    return {
      rawText,
      normalized,
      parsed,
      calculated,
      reconciled,
    };
  }
}
