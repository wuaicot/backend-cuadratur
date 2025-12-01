// src/application/parser/parseReporteZ.ts
import { ParsedReporteZ, Venta } from "../../ocr/types";
import { MENUS, BEBESTIBLES, EMPANADAS, MenuDef, BebestibleDef, EmpanadaDef } from "../../data/inventario";
import { fuzzyMatch } from "../../utils/fuzzy";

// --- Product Lists Setup ---
const BEBESTIBLES_PRODUCTS = Object.values(BEBESTIBLES);
const MENUS_PRODUCTS = Object.values(MENUS);
const EMPANADAS_PRODUCTS = Object.values(EMPANADAS);

const PRODUCT_LISTS = {
  BAR: BEBESTIBLES_PRODUCTS,
  COCINA: MENUS_PRODUCTS,
  EMPANADAS: EMPANADAS_PRODUCTS,
};

const PRODUCT_NAMES = {
  BAR: BEBESTIBLES_PRODUCTS.map((p) => p.nombre),
  COCINA: MENUS_PRODUCTS.map((p) => p.nombre),
  EMPANADAS: EMPANADAS_PRODUCTS.map((p) => p.nombre),
};

type Seccion = "BAR" | "COCINA" | "EMPANADAS" | "UNKNOWN";
type AnyProduct = MenuDef | BebestibleDef | EmpanadaDef;

const cleanLine = (line: string): string => line.replace(/[^a-zA-Z0-9\s]/g, "").trim();

/**
 * Determines the section for a given line by looking backwards from its position
 * to find the last relevant section header, ignoring numbers.
 */
const getSectionForLine = (lineIndex: number, allLines: string[]): Seccion => {
  for (let i = lineIndex; i >= 0; i--) {
    const lowerLine = allLines[i].toLowerCase();
    // Use only keywords, as numbers are unreliable according to OCR logs
    if (lowerLine.includes("bar")) return "BAR";
    if (lowerLine.includes("cocina")) return "COCINA";
    if (lowerLine.includes("empanadas")) return "EMPANADAS";
  }
  return "UNKNOWN";
};


export function parseReporteZ(texto: string): ParsedReporteZ {
  const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);

  const ventas = lineas.flatMap((line, index) => {
    const section = getSectionForLine(index, lineas);
    const lowerLine = line.toLowerCase();

    // Ignore lines if they are not in a known section or are clearly not product lines
    if (section === 'UNKNOWN' || lowerLine.includes('total c.produccion') || !/\d/.test(line)) {
        return [];
    }
    // Also ignore lines that are section headers themselves to avoid processing them
    if (lowerLine.includes("bar") || lowerLine.includes("cocina") || lowerLine.includes("empanadas")) {
       const parts = lowerLine.split(" ");
       if(parts.some(p => p === "bar" || p === "cocina" || p === "empanadas")) return [];
    }

    const currentProductList = PRODUCT_LISTS[section];
    const currentProductNames = PRODUCT_NAMES[section];

    let productInfo: AnyProduct | undefined;
    let cantidad: number | undefined;

    // --- Attempt 1: Match by Code ---
    const codeMatch = line.match(/\b(\d{4})\b/);
    if (codeMatch) {
      const ocrCode = codeMatch[1];
      productInfo = currentProductList.find((p) => p.codigo === ocrCode);
    }

    // --- Attempt 2: Fuzzy Match by Name (if code match fails) ---
    if (!productInfo && currentProductNames.length > 0) {
      const cleanedForNameMatch = cleanLine(line).replace(/\d/g, '').trim();
      if (cleanedForNameMatch.length > 2) {
        const productMatch = fuzzyMatch(cleanedForNameMatch, currentProductNames, 0.45);
        if (productMatch) {
          productInfo = currentProductList.find((p) => p.nombre === productMatch.key);
        }
      }
    }
    
    // --- Quantity Extraction (if we have a product) ---
    if (productInfo) {
      const allNumbersInLine = (line.match(/\d+/g) || []);
      const numbersInName = (productInfo.nombre.match(/\d+/g) || []);
      
      let potentialQuantities = allNumbersInLine.filter(num => !numbersInName.includes(num));
      potentialQuantities = potentialQuantities.filter(num => !(num.length >= 4 && num !== productInfo?.codigo));
      potentialQuantities = potentialQuantities.filter(num => Number(num) < 100);

      if (potentialQuantities.length > 0) {
        cantidad = Number(potentialQuantities[potentialQuantities.length - 1]);
      }
    }

    if (productInfo && cantidad !== undefined && cantidad > 0) {
      return [{
        codigo: productInfo.codigo,
        descripcion: productInfo.nombre,
        cantidad: cantidad,
      }];
    }
    
    return [];
  });

  const fechaMatch = texto.match(/FECHA \+ (\d{2}\/\d{2}\/\d{4})/);
  const fecha = fechaMatch ? new Date(fechaMatch[1].split('/').reverse().join('-')) : new Date();

  return { fecha, ventas };
}
