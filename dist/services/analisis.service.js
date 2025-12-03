import { BEBESTIBLES, MENUS } from "../data/inventario";
import { fuzzyMatch } from "../utils/fuzzy";
export class AnalisisService {
    analyze(planillaCaja, planillaCocina, reporteZ) {
        const ventasPorBebestible = this._mapVentasBebestibles(reporteZ);
        const ventasPorMenu = this._mapVentasMenus(reporteZ);
        return {
            fechaAnalisis: new Date(),
            caja: planillaCaja ? this._analizarCaja(planillaCaja, ventasPorBebestible) : [],
            cocina: planillaCocina ? this._analizarCocina(planillaCocina, ventasPorMenu) : [],
            resumen: {
                totalBebestiblesAnalizados: planillaCaja?.items.length ?? 0,
                totalIngredientesAnalizados: planillaCocina?.items.length ?? 0,
            },
        };
    }
    // -----------------------------
    //   NUEVO: MATCHING INTELIGENTE
    // -----------------------------
    _matchBebestible(nombre) {
        const candidatos = Object.values(BEBESTIBLES).map(b => b.nombre);
        return fuzzyMatch(nombre, candidatos, 0.45); // umbral ajustable
    }
    _matchMenu(nombre) {
        const candidatos = Object.values(MENUS).map(m => m.nombre || m.codigo);
        return fuzzyMatch(nombre, candidatos, 0.45);
    }
    // -----------------------------
    //   MAPEO DE VENTAS USANDO FUZZY
    // -----------------------------
    _mapVentasBebestibles(reporte) {
        const map = {};
        for (const v of reporte.ventas) {
            const match = this._matchBebestible(v.descripcion);
            if (!match)
                continue;
            const bebida = Object.values(BEBESTIBLES).find(b => b.nombre === match.key);
            if (!bebida)
                continue;
            map[bebida.codigo] = (map[bebida.codigo] || 0) + v.cantidad;
        }
        return map;
    }
    _mapVentasMenus(reporte) {
        const map = {};
        for (const v of reporte.ventas) {
            const match = this._matchMenu(v.descripcion);
            if (!match)
                continue;
            const menu = Object.values(MENUS).find(m => m.nombre === match.key || m.codigo === match.key);
            if (!menu)
                continue;
            map[menu.codigo] = (map[menu.codigo] || 0) + v.cantidad;
        }
        return map;
    }
    // -----------------------------
    //    ANÁLISIS DE CAJA
    // -----------------------------
    _analizarCaja(planilla, ventasMap) {
        const results = [];
        const planillaMap = new Map();
        for (const it of planilla.items)
            planillaMap.set(this._normalize(it.nombre), it);
        for (const bebida of Object.values(BEBESTIBLES)) {
            const keyName = this._normalize(bebida.nombre);
            const planillaItem = planillaMap.get(keyName);
            if (!planillaItem)
                continue;
            const inicial = Number(planillaItem.saldo ?? 0);
            const entrada = Number(planillaItem.entrada ?? 0);
            const finalReportado = Number(planillaItem.total ?? 0);
            const vendidasSegunZ = Number(ventasMap[bebida.codigo] ?? 0);
            const teoricoFinal = inicial + entrada - vendidasSegunZ;
            const diferencia = Number((finalReportado - teoricoFinal).toFixed(4));
            results.push({
                nombre: bebida.nombre,
                contado: finalReportado,
                teorico: teoricoFinal,
                diferencia,
                estado: diferencia === 0 ? "OK" : diferencia > 0 ? "SOBRANTE" : "FALTANTE",
                detalle: `vendidasZ=${vendidasSegunZ}, inicial=${inicial}, entrada=${entrada}`,
            });
        }
        return results;
    }
    // -----------------------------
    //   ANÁLISIS DE COCINA
    // -----------------------------
    _analizarCocina(planilla, ventasMenus) {
        const consumoTeorico = {};
        for (const [codigo, qty] of Object.entries(ventasMenus)) {
            const menu = MENUS[codigo];
            if (!menu)
                continue;
            for (const ing of menu.ingredientes) {
                consumoTeorico[ing.nombre] =
                    (consumoTeorico[ing.nombre] || 0) + (Number(ing.cantidad || 0) * qty);
            }
        }
        const results = [];
        const planillaMap = new Map();
        for (const it of planilla.items)
            planillaMap.set(this._normalize(it.nombre), it);
        for (const [ingName, consumo] of Object.entries(consumoTeorico)) {
            const clave = this._normalize(ingName);
            const planillaItem = planillaMap.get(clave);
            if (!planillaItem) {
                results.push({
                    nombre: ingName,
                    contado: 0,
                    teorico: consumo,
                    diferencia: -consumo,
                    estado: "NO_DATA",
                    detalle: `Ingrediente calculado por ventas pero no encontrado en la planilla`,
                });
                continue;
            }
            const inicial = Number(planillaItem.saldo ?? 0);
            const entrada = Number(planillaItem.entrada ?? 0);
            const finalReportado = Number(planillaItem.total ?? 0);
            const teoricoFinal = inicial + entrada - consumo;
            const diferencia = Number((finalReportado - teoricoFinal).toFixed(4));
            results.push({
                nombre: ingName,
                contado: finalReportado,
                teorico: teoricoFinal,
                diferencia,
                estado: diferencia === 0 ? "OK" : diferencia > 0 ? "SOBRANTE" : "FALTANTE",
                detalle: `consumoEsperado=${consumo}, inicial=${inicial}, entrada=${entrada}`,
            });
        }
        // verificar ingredientes sin consumo detectado
        for (const it of planilla.items) {
            const n = it.nombre;
            if (!consumoTeorico[n]) {
                const inicial = Number(it.saldo ?? 0);
                const entrada = Number(it.entrada ?? 0);
                const finalReportado = Number(it.total ?? 0);
                const teoricoFinal = inicial + entrada;
                const diferencia = Number((finalReportado - teoricoFinal).toFixed(4));
                results.push({
                    nombre: n,
                    contado: finalReportado,
                    teorico: teoricoFinal,
                    diferencia,
                    estado: diferencia === 0 ? "OK" : diferencia > 0 ? "SOBRANTE" : "FALTANTE",
                    detalle: `No se detectaron ventas asociadas en el reporteZ para este ingrediente`,
                });
            }
        }
        return results;
    }
    _normalize(s) {
        return (s || "").toString().trim().toLowerCase();
    }
}
