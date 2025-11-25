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

  async ejecutar(params: {
    files: {
      reporteZ: Express.Multer.File;
      planillaCaja: Express.Multer.File;
      planillaCocina: Express.Multer.File;
    };
    usuario: string;
  }) {
    const { reporteZ, planillaCaja, planillaCocina } = params.files;

    const z = await this.processImage(reporteZ, "reporteZ");
    const caja = await this.processImage(planillaCaja, "caja");
    const cocina = await this.processImage(planillaCocina, "cocina");

    const rZ = z.reconciled?.reconciled ?? [];
    const rCaja = caja.reconciled?.reconciled ?? [];
    const rCocina = cocina.reconciled?.reconciled ?? [];

    const mapToItem = (row: any) => {
      const teorico = Number(row.theoretical ?? row.teorico ?? 0);
      const contado = Number(row.counted ?? row.contado ?? 0);
      const diferencia = contado - teorico;

      return {
        nombre: row.name ?? row.item ?? "Sin nombre",
        teorico,
        contado,
        diferencia,
        estado: diferencia === 0 ? "OK" : "Descuadre",
      };
    };

    const itemsFinal = [
      ...rZ.map(mapToItem),
      ...rCaja.map(mapToItem),
      ...rCocina.map(mapToItem),
    ];

    return {
      fecha: new Date().toISOString(),
      usuario: params.usuario,
      items: itemsFinal,
      origen: {
        reporteZ: z,
        caja,
        cocina,
      },
    };
  }

  async processImage(
    file: Express.Multer.File,
    tipo: "caja" | "cocina" | "reporteZ"
  ) {
    const ocrResult = await this.ocr.procesarImagen(file, tipo);

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