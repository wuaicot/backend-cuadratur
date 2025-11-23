import { ParsedPlanilla, ParsedReporteZ } from "../../ocr/types";
import { MENUS, BEBESTIBLES, INGREDIENTES_MASTER, MenuDef, BebestibleDef } from '../../data/inventario';
import { fuzzyMatch } from '../../utils/fuzzy';

type Product = MenuDef | BebestibleDef;

// Interfaz para el resultado del análisis de un solo ítem
export interface AnalisisItem {
  nombre: string;
  teorico: number;
  contado: number;
  diferencia: number;
  estado: 'OK' | 'SOBRANTE' | 'FALTANTE';
}

// Interfaz para la respuesta que se envía al frontend
export interface AnalisisResponse {
  fecha: string;
  items: AnalisisItem[];
}

interface OcrDataBundle {
    reporteZ: ParsedReporteZ;
    planillaCaja: ParsedPlanilla;
    planillaCocina: ParsedPlanilla;
}

/**
 * AnalisisService es un servicio sin estado que realiza la lógica de negocio
 * de la cuadratura. Utiliza datos estáticos de `inventario.ts` para
 * resolver productos, recetas e ingredientes.
 */
export class AnalisisService {
    constructor() {}

    /**
     * Ejecuta el análisis de cuadratura completo.
     * @param input - Contiene los datos de OCR de los tres archivos.
     * @returns El resultado del análisis formateado para el frontend.
     */
    async ejecutarAnalisis(input: {
        ocrData: OcrDataBundle;
    }): Promise<{ frontendResponse: AnalisisResponse }> {
        const { ocrData } = input;
        const ocrDate = new Date(ocrData.reporteZ.fecha);

        // 1. Calcular el consumo TEÓRICO basado en las ventas del Reporte Z
        const teoricoMap = this.calcularConsumoTeorico(ocrData.reporteZ);

        // 2. Calcular el consumo CONTADO basado en las planillas de inventario
        const contadoMap = this.calcularConsumoContado(ocrData.planillaCaja, ocrData.planillaCocina);

        // 3. Comparar ambos mapas para obtener el resultado final
        const items = this.compararConsumos(teoricoMap, contadoMap);
        
        // 4. Formatear y retornar la respuesta para el frontend
        return {
            frontendResponse: {
                fecha: ocrDate.toISOString(),
                items: items,
            }
        };
    }

    private calcularConsumoTeorico(reporteZ: ParsedReporteZ): Map<string, number> {
        const teoricoMap = new Map<string, number>();

        for (const venta of reporteZ.ventas) {
            const producto = MENUS[venta.codigo] || BEBESTIBLES[venta.codigo];
            if (!producto) continue; // Si el producto no existe en nuestro inventario, lo ignoramos

            // Si es un menú, iteramos sus ingredientes
            if ('ingredientes' in producto) {
                for (const ingredienteDef of producto.ingredientes) {
                    const cantidadConsumida = ingredienteDef.cantidad * venta.cantidad;
                    teoricoMap.set(
                        ingredienteDef.nombre,
                        (teoricoMap.get(ingredienteDef.nombre) || 0) + cantidadConsumida
                    );
                }
            } else {
                            // Si es un bebestible, el "ingrediente" es el producto mismo
                            const bebestible = producto as BebestibleDef; // Type assertion
                            teoricoMap.set(
                                bebestible.nombre,
                                (teoricoMap.get(bebestible.nombre) || 0) + venta.cantidad
                            );            }
        }
        return teoricoMap;
    }

    private calcularConsumoContado(planillaCaja: ParsedPlanilla, planillaCocina: ParsedPlanilla): Map<string, number> {
        const contadoMap = new Map<string, number>();
        const allInventarioItems = [...planillaCaja.items, ...planillaCocina.items];
        
        const masterIngredientNames = Object.keys(INGREDIENTES_MASTER);

        for (const item of allInventarioItems) {
            // Usar fuzzy matching para encontrar el nombre canónico del ingrediente
            const match = fuzzyMatch(item.nombre, masterIngredientNames);
            
            // Si no hay un match confiable, podríamos ignorarlo o registrarlo con su nombre original
            if (!match || match.score < 0.7) { // Umbral de confianza
                 console.warn(`No se encontró un match claro para el ingrediente del OCR: '${item.nombre}'`);
                 continue;
            }

            const canonicalName = match.key;
            const consumoContado = (item.saldo || 0) + (item.entrada || 0) - (item.total || 0);

            contadoMap.set(
                canonicalName,
                (contadoMap.get(canonicalName) || 0) + consumoContado
            );
        }
        return contadoMap;
    }

    private compararConsumos(teoricoMap: Map<string, number>, contadoMap: Map<string, number>): AnalisisItem[] {
        const allIngredientNames = new Set([...teoricoMap.keys(), ...contadoMap.keys()]);
        const frontendItems: AnalisisItem[] = [];

        for (const nombre of allIngredientNames) {
            const teorico = teoricoMap.get(nombre) || 0;
            const contado = contadoMap.get(nombre) || 0;
            const diferencia = contado - teorico;

            let estado: 'OK' | 'SOBRANTE' | 'FALTANTE' = 'OK';
            if (diferencia > 0.1) estado = 'SOBRANTE'; // Pequeño margen de error
            if (diferencia < -0.1) estado = 'FALTANTE';

            frontendItems.push({
                nombre,
                teorico: parseFloat(teorico.toFixed(2)),
                contado: parseFloat(contado.toFixed(2)),
                diferencia: parseFloat(diferencia.toFixed(2)),
                estado,
            });
        }
        
        return frontendItems;
    }
}