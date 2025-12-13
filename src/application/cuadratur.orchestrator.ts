// src/application/cuadratur.orchestrator.ts
import { PrismaClient } from "@prisma/client";
import { OCRService } from "../ocr/ocr.service";
import { NormalizerService } from "./normalizer/normalizer.service";
import { ParserService } from "./parser/parser.service";
import { ConsumptionCalculatorService } from "./calculator/consumption-calculator.service";
import { ReconciliatorService } from "./reconciliator/reconciliator.service";
import { ParsedPlanilla, ParsedReporteZ, PlanillaCocinaParsed } from "../ocr/types"; // Import the new type

// No longer importing MENUS from inventario.ts

type MenuDef = {
  codigo: string;
  nombre: string;
  ingredientes: { nombre: string; cantidad: number }[];
};

type ParsedPlanillaItemLike = Record<string, any>;

type AnalysisItem = {
  nombre: string;
  teorico: number;
  contado: number;
  diferencia: number;
  estado: "OK" | "SOBRANTE" | "FALTANTE";
};

export class CuadraturOrchestrator {
  private readonly ocr: OCRService;
  private readonly normalizer: NormalizerService;
  private readonly parser: ParserService;
  private readonly calculator: ConsumptionCalculatorService;
  private readonly reconciliator: ReconciliatorService;
  private readonly prisma: PrismaClient;

  constructor() {
    this.ocr = new OCRService();
    this.normalizer = new NormalizerService();
    this.parser = new ParserService();
    this.calculator = new ConsumptionCalculatorService();
    this.reconciliator = new ReconciliatorService();
    this.prisma = new PrismaClient();
  }

  /**
   * Método usado por el controller.
   * Espera los archivos multer (buffers) para reporteZ, planillaCaja, planillaCocina.
   * Devuelve un objeto listo para el frontend con fecha y items[].
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

    // Ejecuta OCR+parsers (cada uno devuelve su estructura específica)
    // Aquí OCRService.procesarImagen acepta el file (Multer File) y tipo
    const reporteZParsed = (await this.ocr.procesarImagen(
      reporteZ,
      "reporteZ"
    )) as {
      fecha: Date;
      ventas: Array<{ codigo: string; cantidad: number; descripcion?: string }>;
    };

    console.log("--- INICIO: Datos extraídos del Reporte Z ---");
    console.table(reporteZParsed.ventas);
    console.log("--- FIN: Datos extraídos del Reporte Z ---");

    const cocinaParsed = (await this.ocr.procesarImagen(
      planillaCocina,
      "cocina"
    )) as PlanillaCocinaParsed;

    const cajaParsed = (await this.ocr.procesarImagen(
      planillaCaja,
      "caja"
    )) as { tipo?: string; fecha?: Date; items: ParsedPlanillaItemLike[] };

    // Fetch products and their recipes from the database
    const productosConRecetas = await this.prisma.producto.findMany({
      include: {
        recetas: {
          include: {
            ingrediente: true,
          },
        },
      },
    });

    // Transform products into a map similar to MENUS for easier integration
    const menusFromDb: Record<string, MenuDef> = {};
    productosConRecetas.forEach(producto => {
      menusFromDb[producto.codigoZ] = {
        codigo: producto.codigoZ,
        nombre: producto.nombre,
        ingredientes: producto.recetas.map(receta => ({
          nombre: receta.ingrediente.nombre,
          cantidad: receta.cantidad,
        })),
      };
    });

    // 1) Construir mapa de ventas por codigo desde reporte Z
    const ventasPorCodigo: Record<string, number> = {};
    (reporteZParsed.ventas || []).forEach((v) => {
      const code = String(v.codigo).trim();
      const qty = Number(v.cantidad) || 0;
      ventasPorCodigo[code] = (ventasPorCodigo[code] || 0) + qty;
    });

    // 2) Calcular teorico por ingrediente basado en MENUS + ventas
    const teoricoPorIngrediente: Record<string, number> = {};

    Object.values(menusFromDb).forEach((menu) => {
      const ventas = ventasPorCodigo[menu.codigo] || 0;
      if (ventas <= 0) return;
      (menu.ingredientes || []).forEach((ing) => {
        const name = (ing.nombre || "").trim();
        const reqPerMenu = Number(ing.cantidad) || 0;
        teoricoPorIngrediente[name] =
          (teoricoPorIngrediente[name] || 0) + ventas * reqPerMenu;
      });
    });

    // 3) Agregar ingredientes que aparezcan en MENUS pero con 0 ventas (para listado completo)
    Object.values(menusFromDb).forEach((m) =>
      (m.ingredientes || []).forEach((ing) => {
        if (!teoricoPorIngrediente[ing.nombre]) {
          teoricoPorIngrediente[ing.nombre] = 0;
        }
      })
    );

    // 4) Extraer consumos (o sobrantes) desde la planilla de cocina del nuevo formato grid.
    //    Ahora cocinaParsed es PlanillaCocinaParsed
    const consumoPorIngredienteGrid: Record<
      string,
      { saldoInicial: number; entradas: number; devoluciones: number; saldoFinal: number }
    > = {};

    for (const ingredientName in cocinaParsed) {
      if (Object.prototype.hasOwnProperty.call(cocinaParsed, ingredientName)) {
        const data = cocinaParsed[ingredientName];
        const sumQuantities = (quantities: number[]) => quantities.reduce((acc, curr) => acc + curr, 0);

        const saldoInicial = sumQuantities(data.INIC);
        const entradas = sumQuantities(data.ENTR);
        const devoluciones = sumQuantities(data.DEV);
        const saldoFinal = sumQuantities(data.FIN);

        consumoPorIngredienteGrid[ingredientName] = {
          saldoInicial,
          entradas,
          devoluciones,
          saldoFinal,
        };
      }
    }

    // 5) Para cada ingrediente del inventario, buscar registro en planilla y calcular consumo
    const ingredientAnalysis: Record<
      string,
      { teorico: number; contadoRaw: number }
    > = {};

    Object.keys(teoricoPorIngrediente).forEach((ingred) => {
      ingredientAnalysis[ingred] = {
        teorico: teoricoPorIngrediente[ingred] || 0,
        contadoRaw: 0,
      };
    });

    Object.keys(ingredientAnalysis).forEach((ingred) => {
      const consumoGridData = consumoPorIngredienteGrid[ingred];
      if (consumoGridData) {
        const consumo =
          consumoGridData.saldoInicial +
          consumoGridData.entradas -
          consumoGridData.devoluciones -
          consumoGridData.saldoFinal;
        ingredientAnalysis[ingred].contadoRaw = consumo;
      }
    });

    // 6) Construir lista final de AnalysisItem
    const finalItems: AnalysisItem[] = Object.keys(ingredientAnalysis).map(
      (ingred) => {
        const teorico = Math.round(ingredientAnalysis[ingred].teorico || 0);
        const consumo = ingredientAnalysis[ingred].contadoRaw || 0;
        const contado = Math.abs(Math.round(consumo)); // mostrar positivo (consumo absoluto / sobrante)
        const diferencia = teorico - contado;
        const estado: AnalysisItem["estado"] =
          diferencia === 0 ? "OK" : diferencia > 0 ? "SOBRANTE" : "FALTANTE";
        return {
          nombre: ingred,
          teorico,
          contado,
          diferencia,
          estado,
        };
      }
    );

    // Orden opcional: mostrar primero con mayor diferencia absoluta
    finalItems.sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia));

    // 7) Persistir el análisis en la base de datos
    // Find or create the user
    let user = await this.prisma.usuario.findUnique({
      where: { nombre: params.usuario },
    });

    if (!user) {
      user = await this.prisma.usuario.create({
        data: { nombre: params.usuario },
      });
    }

    const analysisDate = reporteZParsed.fecha ? new Date(reporteZParsed.fecha) : new Date();
    // Assuming 'turno' could be part of reporteZParsed or derived. For now, leaving it optional.
    const analysisTurno = undefined; // Or extract from reporteZParsed if available

    await this.prisma.analisis.create({
      data: {
        fecha: analysisDate,
        data: {
          items: finalItems,
          origen: {
            reporteZ: reporteZParsed,
            planillaCocina: cocinaParsed,
            planillaCaja: cajaParsed,
          },
        },
        turno: analysisTurno,
        usuarioId: user.id, // Link to the user
      },
    });

    // Respuesta lista para frontend
    return {
      fecha: analysisDate.toISOString(),
      usuario: params.usuario,
      items: finalItems,
      origen: {
        reporteZ: reporteZParsed,
        planillaCocina: cocinaParsed,
        planillaCaja: cajaParsed,
      },
    };
  }

  // --- preserve processImage por compatibilidad interna si se usa en otros puntos ---
  /*
  async processImage(
    file: Express.Multer.File,
    tipo: "caja" | "cocina" | "reporteZ"
  ) {
    const ocrResult = await this.ocr.procesarImagen(file, tipo);
    const rawText =
      typeof ocrResult === "string" ? ocrResult : JSON.stringify(ocrResult);
    const normalized = this.normalizer.normalize(rawText) ?? {
      cleaned: rawText,
    };
    if (!normalized.cleaned) normalized.cleaned = rawText;
    const parsed = this.parser.parseTextToSheet(normalized.cleaned) ?? {
      rows: [],
    };
    const calculated = this.calculator.compute(parsed) ?? { results: [] };
    const reconciled = this.reconciliator.reconcile(calculated) ?? {
      reconciled: [],
    };
    return { rawText, normalized, parsed, calculated, reconciled };
  }
  */
}
