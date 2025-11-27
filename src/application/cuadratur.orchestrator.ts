// src/application/cuadratur.orchestrator.ts
import { OCRService } from "../ocr/ocr.service";
import { NormalizerService } from "./normalizer/normalizer.service";
import { ParserService } from "./parser/parser.service";
import { ConsumptionCalculatorService } from "./calculator/consumption-calculator.service";
import { ReconciliatorService } from "./reconciliator/reconciliator.service";

import { MENUS } from "../data/inventario"; // importa tu inventario real

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

  constructor() {
    this.ocr = new OCRService();
    this.normalizer = new NormalizerService();
    this.parser = new ParserService();
    this.calculator = new ConsumptionCalculatorService();
    this.reconciliator = new ReconciliatorService();
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

    const cocinaParsed = (await this.ocr.procesarImagen(
      planillaCocina,
      "cocina"
    )) as { tipo?: string; fecha?: Date; items: ParsedPlanillaItemLike[] };

    const cajaParsed = (await this.ocr.procesarImagen(
      planillaCaja,
      "caja"
    )) as { tipo?: string; fecha?: Date; items: ParsedPlanillaItemLike[] };

    // 1) Construir mapa de ventas por codigo desde reporte Z
    const ventasPorCodigo: Record<string, number> = {};
    (reporteZParsed.ventas || []).forEach((v) => {
      const code = String(v.codigo).trim();
      const qty = Number(v.cantidad) || 0;
      ventasPorCodigo[code] = (ventasPorCodigo[code] || 0) + qty;
    });

    // 2) Calcular teorico por ingrediente basado en MENUS + ventas
    const teoricoPorIngrediente: Record<string, number> = {};

    Object.values(MENUS as Record<string, MenuDef>).forEach((menu) => {
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
    Object.values(MENUS as Record<string, MenuDef>).forEach((m) =>
      (m.ingredientes || []).forEach((ing) => {
        if (!teoricoPorIngrediente[ing.nombre]) {
          teoricoPorIngrediente[ing.nombre] = 0;
        }
      })
    );

    // 4) Extraer consumos (o sobrantes) desde la planilla de cocina.
    // Heurística para leer columnas: cada item puede contener keys distintas por el parser.
    // Intentamos obtener: saldo_inicial, entrada, devoluc, saldo_final.
    function readNumberFromItem(
      item: ParsedPlanillaItemLike,
      candidates: string[]
    ): number {
      for (const k of candidates) {
        if (Object.prototype.hasOwnProperty.call(item, k)) {
          const v = item[k];
          if (v === undefined || v === null) continue;
          const n = Number(
            String(v)
              .replace(/[^0-9\-,.]+/g, "")
              .replace(",", ".")
          );
          if (!Number.isNaN(n)) return n;
        }
      }
      return 0;
    }

    // Normalizar nombres de fila para mapear
    function normalizeName(s: string): string {
      return (s || "").toString().trim().toLowerCase();
    }

    // Construir mapa de planilla: nombre -> item
    const planillaItems = (cocinaParsed.items || []).map((it) => {
      // detect probable name key
      const probableNameKeyCandidates = [
        "nombre",
        "mercaderia",
        "producto",
        "item",
        "articulo",
        "descripcion",
        "desc",
      ];
      let name = "";
      for (const k of probableNameKeyCandidates) {
        if (it[k]) {
          name = String(it[k]);
          break;
        }
      }
      // fallback: tomar primer string property
      if (!name) {
        for (const k of Object.keys(it)) {
          if (typeof it[k] === "string" && it[k].trim().length > 0) {
            name = it[k];
            break;
          }
        }
      }

      // lectores para números en distintos formatos
      const saldoInicial = readNumberFromItem(it, [
        "saldo",
        "saldo_inicial",
        "saldoInicial",
        "saldo1",
        "saldo_ant",
        "saldo_anteriores",
        "cantidad_inicio",
      ]);
      const entrada = readNumberFromItem(it, [
        "entrada",
        "entradas",
        "ingreso",
        "ingresos",
      ]);
      const devoluc = readNumberFromItem(it, [
        "devoluc",
        "devolucion",
        "devoluciones",
        "devoluciones",
      ]);
      const saldoFinal = readNumberFromItem(it, [
        "saldo_final",
        "saldoFinal",
        "saldo2",
        "saldo_planchero",
        "saldo_planchero1",
        "saldo_actual",
        "total",
      ]);

      return {
        raw: it,
        name: String(name || "").trim(),
        saldoInicial,
        entrada,
        devoluc,
        saldoFinal,
      };
    });

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

    // Mapeo por normalizado para buscar más fácil
    const planillaByNameNorm: Record<string, (typeof planillaItems)[0][]> = {};
    planillaItems.forEach((row) => {
      const key = normalizeName(row.name);
      if (!planillaByNameNorm[key]) planillaByNameNorm[key] = [];
      planillaByNameNorm[key].push(row);
    });

    // Matching simple: for each ingredient name, try exact normalized match, otherwise try includes() search
    const allPlanillaRows = planillaItems;

    Object.keys(ingredientAnalysis).forEach((ingred) => {
      const normIngred = normalizeName(ingred);

      // matchedRow puede ser null inicialmente
      let matchedRow:
        | {
            raw: ParsedPlanillaItemLike;
            name: string;
            saldoInicial: number;
            entrada: number;
            devoluc: number;
            saldoFinal: number;
          }
        | null = null;

      // 1) exact
      if (planillaByNameNorm[normIngred] && planillaByNameNorm[normIngred].length > 0) {
        matchedRow = planillaByNameNorm[normIngred][0];
      }

      // 2) includes search (insensitive)
      if (!matchedRow) {
        const found = allPlanillaRows.find((r) =>
          normalizeName(r.name).includes(normIngred)
        );
        if (found) matchedRow = found;
      }

      // 3) reverse includes (ingredient name contains planilla token)
      if (!matchedRow) {
        const found = allPlanillaRows.find((r) =>
          normIngred.includes(normalizeName(r.name))
        );
        if (found) matchedRow = found;
      }

      // 4) fallback robusto tipado (nunca undefined)
      if (!matchedRow) {
        matchedRow = {
          raw: {},
          name: ingred,
          saldoInicial: 0,
          entrada: 0,
          devoluc: 0,
          saldoFinal: 0,
        };
      }

      const consumo =
        matchedRow.saldoInicial + matchedRow.entrada - matchedRow.devoluc - matchedRow.saldoFinal;
      ingredientAnalysis[ingred].contadoRaw = consumo; // puede ser negativo (sobrante)
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

    // Respuesta lista para frontend
    return {
      fecha: new Date().toISOString(),
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
}
