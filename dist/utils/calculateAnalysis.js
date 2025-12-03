// src/utils/calculateAnalysis.ts
// Funciones para convertir el payload del backend en una lista de AnalysisItem
// Formato B: mostrado con números absolutos, diferencia positiva, estado (OK/FALTANTE/SOBRANTE)
import { MENUS } from "../data/inventario";
// Normalizar string para comparaciones
function normalizeStr(s) {
    if (!s)
        return "";
    return s
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "") // quitar acentos
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
// Extrae ventas por código desde el objeto reporteZ (intenta varios shapes)
function extractVentasFromReporteZ(reporteData) {
    // si ya viene estructurado
    if (!reporteData)
        return [];
    if (Array.isArray(reporteData.ventas))
        return reporteData.ventas;
    if (Array.isArray(reporteData.data?.ventas))
        return reporteData.data.ventas;
    // fallback: buscar en ventas en cualquier lugar
    if (Array.isArray(reporteData))
        return reporteData;
    return [];
}
// Extrae filas de planilla (intenta varios nombres posibles)
function extractRowsFromPlanilla(planillaData) {
    if (!planillaData)
        return [];
    if (Array.isArray(planillaData.items))
        return planillaData.items;
    if (Array.isArray(planillaData.rows))
        return planillaData.rows;
    if (Array.isArray(planillaData.parsed?.rows))
        return planillaData.parsed.rows;
    if (Array.isArray(planillaData.parsed?.items))
        return planillaData.parsed.items;
    return [];
}
// Dado un row intenta calcular contado con heurística:
// contado = SALDO_INICIAL + ENTRADA - DEVOLUCION - SALDO_FINAL
function computeContadoFromRow(row) {
    // Nombres posibles de campos que pueden contener los valores
    const possibles = {
        saldoInicial: ["saldo", "saldoi", "saldo_inicial", "saldo_in", "sal_ini"],
        entrada: ["entrada", "entradas", "entrada_s", "ingreso"],
        devolucion: ["devoluc", "devolucion", "devoluciones", "dev"],
        saldoFinal: ["saldo_final", "saldef", "saldof", "total", "saldo_plancha", "saldo2", "saldoactual", "saldo_planchero"],
        // a veces el parser pone 'venta' o 'falta' etc.
    };
    const findNumber = (keys) => {
        for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null) {
                const n = Number(row[k]);
                if (!Number.isNaN(n))
                    return n;
            }
            // prueba versión lowercase keys
            const kl = k.toLowerCase();
            for (const rk of Object.keys(row)) {
                if (rk.toLowerCase().includes(kl)) {
                    const n = Number(row[rk]);
                    if (!Number.isNaN(n))
                        return n;
                }
            }
        }
        return 0;
    };
    const saldoIni = findNumber(possibles.saldoInicial);
    const entrada = findNumber(possibles.entrada);
    const devol = findNumber(possibles.devolucion);
    const saldoFin = findNumber(possibles.saldoFinal);
    // La fórmula que pediste: SALDO_INICIAL + ENTRADA − DEVOLUCION − SALDO_FINAL
    const contado = saldoIni + entrada - devol - saldoFin;
    return contado;
}
// Busca fila por nombre de ingrediente (fuzzy)
function findRowByIngredient(rows, ingredientName) {
    const nTarget = normalizeStr(ingredientName);
    // 1) exact match
    for (const r of rows) {
        const candidates = [
            r.nombre,
            r.producto,
            r.mercaderia,
            r.descripcion,
            r.name,
            r.item,
            r[0],
        ];
        for (const c of candidates) {
            if (!c)
                continue;
            if (normalizeStr(String(c)) === nTarget)
                return r;
        }
    }
    // 2) includes
    for (const r of rows) {
        const candidates = [
            r.nombre,
            r.producto,
            r.mercaderia,
            r.descripcion,
            r.name,
            r.item,
            r[0],
        ];
        for (const c of candidates) {
            if (!c)
                continue;
            const nc = normalizeStr(String(c));
            if (nc.includes(nTarget) || nTarget.includes(nc))
                return r;
        }
    }
    return null;
}
/**
 * Entrada: payload.items (el array que devuelve tu backend),
 * que esperamos tenga tres elementos tipo: 'reporteZ','caja','cocina' (o similar).
 *
 * Devuelve: AnalysisItem[] listo para render en la UI.
 */
export function calculateAnalysisFromBackendItems(backendItems) {
    // localizar partes
    const reporte = backendItems.find((it) => it.tipo === "reporteZ")?.data || backendItems.find((it) => it.tipo?.toLowerCase?.().includes("reporte"))?.data;
    const cocina = backendItems.find((it) => it.tipo === "cocina")?.data || backendItems.find((it) => it.tipo?.toLowerCase?.().includes("cocina"))?.data;
    const caja = backendItems.find((it) => it.tipo === "caja")?.data || backendItems.find((it) => it.tipo?.toLowerCase?.().includes("caja"))?.data;
    const ventas = extractVentasFromReporteZ(reporte);
    const soldByMenu = {};
    // ventas puede venir con {codigo, cantidad}
    for (const v of ventas) {
        const code = String(v.codigo ?? v.code ?? v.cod ?? "").padStart(4, "0");
        const qty = Number(v.cantidad ?? v.qty ?? v.cantidad_vendida ?? v.cant ?? v.cantidad) || 0;
        if (!code)
            continue;
        soldByMenu[code] = (soldByMenu[code] || 0) + qty;
    }
    // Construir teorico por ingrediente recorriendo MENUS
    const teoricoByIngredient = {};
    for (const code of Object.keys(soldByMenu)) {
        const qtyVendidos = soldByMenu[code];
        const menu = MENUS[code];
        if (!menu)
            continue;
        for (const ing of menu.ingredientes) {
            const nombre = ing.nombre;
            const need = (ing.cantidad || 1) * qtyVendidos;
            teoricoByIngredient[nombre] = (teoricoByIngredient[nombre] || 0) + need;
        }
    }
    // Extraer filas de cocina
    const cocinaRows = extractRowsFromPlanilla(cocina);
    // si no hay rows, intenta extraer de caja como respaldo
    const cajaRows = extractRowsFromPlanilla(caja);
    const rows = cocinaRows.length ? cocinaRows : cajaRows;
    // Para cada ingrediente en teoricoByIngredient, buscar su fila y calcular contado
    const result = [];
    for (const ingName of Object.keys(teoricoByIngredient)) {
        const teorico = Math.round(teoricoByIngredient[ingName] * 100) / 100;
        const row = findRowByIngredient(rows, ingName);
        const contadoRaw = row ? computeContadoFromRow(row) : 0;
        const contado = Math.abs(Math.round(contadoRaw * 100) / 100);
        // Diferencia = |contado - teorico| (según formato B pediste mostrar valor positivo)
        const diffVal = Math.abs(Math.round((contado - teorico) * 100) / 100);
        // Estado: si contado === teorico -> OK, si contado > teorico -> SOBRANTE, else FALTANTE
        let estado = "OK";
        if (Math.abs(contado - teorico) < 0.0001)
            estado = "OK";
        else if (contado > teorico)
            estado = "SOBRANTE";
        else
            estado = "FALTANTE";
        result.push({
            nombre: ingName,
            teorico,
            contado,
            diferencia: diffVal,
            estado,
        });
    }
    // Si no se encontraron teoricos (por ejemplo: reporteZ no mapeó a MENUS),
    // tratamos de inferir ingredientes directos desde planilla (fallback)
    if (result.length === 0 && rows.length > 0) {
        for (const r of rows) {
            const nombre = r.nombre || r.producto || r.mercaderia || r.descripcion || String(r[0] ?? "Sin nombre");
            const contadoRaw = computeContadoFromRow(r);
            const contado = Math.abs(Math.round(contadoRaw * 100) / 100);
            const teorico = 0;
            const diffVal = Math.abs(contado - teorico);
            const estado = contado === 0 ? "OK" : (contado > 0 ? "SOBRANTE" : "FALTANTE");
            result.push({ nombre, teorico, contado, diferencia: diffVal, estado });
        }
    }
    // ordenar alfabéticamente por nombre para estabilidad
    result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return result;
}
