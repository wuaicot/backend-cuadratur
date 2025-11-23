import { MENUS } from "../data/inventario";

export type Consumo = Record<string, number>;

export function calcularConsumoTeorico(ventasMenus: Record<string, number>): Consumo {
  const consumo: Consumo = {};

  for (const codigoMenu of Object.keys(ventasMenus)) {
    const cantidadVendida = ventasMenus[codigoMenu];
    const menu = MENUS[codigoMenu];

    if (!menu) continue; // menú no registrado en inventario

    for (const ingrediente of menu.ingredientes) {
      const nombre = ingrediente.nombre;
      const requerido = ingrediente.cantidad * cantidadVendida;

      consumo[nombre] = (consumo[nombre] || 0) + requerido;
    }
  }

  return consumo;
}
