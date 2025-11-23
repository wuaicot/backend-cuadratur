export function determinarTurno(zDate: Date) {
  const hora = zDate.getHours();
  const minutos = zDate.getMinutes();

  // Copia para poder ajustar fecha sin mutar la original
  const fecha = new Date(zDate);

  // Si estamos al día siguiente antes de 10:30 → pertenece al turno 2 del día anterior
  if (hora < 10 || (hora === 10 && minutos <= 30)) {
    fecha.setDate(fecha.getDate() - 1);
    return { turno: 2, fecha };
  }

  // Turno 1 hasta 17:59
  if (hora < 18) {
    return { turno: 1, fecha };
  }

  // Turno 2 desde 18:00 hasta medianoche
  return { turno: 2, fecha };
}
