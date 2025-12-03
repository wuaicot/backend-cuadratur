export function reconciliarInventario(planilla, consumo) {
    const resultados = [];
    for (const fila of planilla) {
        const consumoTeorico = consumo[fila.item] || 0;
        const saldoEsperado = fila.total - consumoTeorico;
        const diferencia = fila.saldoFinal - saldoEsperado;
        const estado = diferencia === 0 ? "OK"
            : diferencia < 0 ? "FALTA"
                : "SOBRA";
        resultados.push({
            item: fila.item,
            total: fila.total,
            saldoFinal: fila.saldoFinal,
            consumoTeorico,
            saldoEsperado,
            diferencia,
            estado,
        });
    }
    return resultados;
}
