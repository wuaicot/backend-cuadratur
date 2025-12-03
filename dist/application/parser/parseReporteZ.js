import { MENUS, BEBESTIBLES, EMPANADAS, } from "../../data/inventario";
import { fuzzyMatch } from "../../utils/fuzzy";
const BEBESTIBLES_PRODUCTS = Object.values(BEBESTIBLES);
const MENUS_PRODUCTS = Object.values(MENUS);
const EMPANADAS_PRODUCTS = Object.values(EMPANADAS);
const PRODUCT_LISTS = {
    BAR: BEBESTIBLES_PRODUCTS,
    COCINA: MENUS_PRODUCTS,
    EMPANADAS: EMPANADAS_PRODUCTS,
    UNKNOWN: [],
};
const PRODUCT_NAMES = {
    BAR: BEBESTIBLES_PRODUCTS.map((p) => p.nombre),
    COCINA: MENUS_PRODUCTS.map((p) => p.nombre),
    EMPANADAS: EMPANADAS_PRODUCTS.map((p) => p.nombre),
    UNKNOWN: [],
};
const cleanLine = (line) => line.replace(/[^a-zA-Z0-9\s]/g, "").trim();
const getSectionForLine = (lineIndex, allLines) => {
    for (let i = lineIndex; i >= 0; i--) {
        const lower = allLines[i].toLowerCase();
        if (lower.includes("bar"))
            return "BAR";
        if (lower.includes("cocina"))
            return "COCINA";
        if (lower.includes("empanadas"))
            return "EMPANADAS";
    }
    return "UNKNOWN";
};
export function parseReporteZ(texto) {
    const lineas = texto
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    const ventas = lineas.flatMap((line, index) => {
        const section = getSectionForLine(index, lineas);
        const lower = line.toLowerCase();
        if (section === "UNKNOWN" ||
            lower.includes("total c.produccion") ||
            !/\d/.test(line)) {
            return [];
        }
        if (lower.includes("bar") ||
            lower.includes("cocina") ||
            lower.includes("empanadas")) {
            const parts = lower.split(" ");
            if (parts.some((p) => p === "bar" || p === "cocina" || p === "empanadas"))
                return [];
        }
        // FIX: tipos explícitos para evitar NEVER
        const productList = PRODUCT_LISTS[section];
        const productNames = PRODUCT_NAMES[section];
        let productInfo;
        let cantidad;
        const codeMatch = line.match(/\b(\d{4})\b/);
        if (codeMatch) {
            const ocrCode = codeMatch[1];
            productInfo = productList.find((p) => p.codigo === ocrCode);
        }
        if (!productInfo && productNames.length > 0) {
            const cleaned = cleanLine(line).replace(/\d/g, "").trim();
            if (cleaned.length > 2) {
                const match = fuzzyMatch(cleaned, productNames, 0.45);
                if (match) {
                    productInfo = productList.find((p) => p.nombre === match.key);
                }
            }
        }
        if (productInfo) {
            const allNums = line.match(/\d+/g) || [];
            const numsInName = productInfo.nombre.match(/\d+/g) || [];
            let potential = allNums.filter((n) => !numsInName.includes(n));
            potential = potential.filter((n) => !(n.length >= 4 && n !== productInfo.codigo));
            potential = potential.filter((n) => Number(n) < 100);
            if (potential.length > 0) {
                cantidad = Number(potential[potential.length - 1]);
            }
        }
        if (productInfo && cantidad !== undefined && cantidad > 0) {
            return [
                {
                    codigo: productInfo.codigo,
                    descripcion: productInfo.nombre,
                    cantidad,
                },
            ];
        }
        return [];
    });
    const fechaMatch = texto.match(/FECHA \+ (\d{2}\/\d{2}\/\d{4})/);
    const fecha = fechaMatch
        ? new Date(fechaMatch[1].split("/").reverse().join("-"))
        : new Date();
    return { fecha, ventas };
}
