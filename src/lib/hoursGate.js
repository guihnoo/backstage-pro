/**
 * Trava de "Confirmar Recebimento" (Lote 3): avisa quando há dia do evento sem horas.
 * Regra do dono: aprovar o recebimento só com as horas preenchidas. O usuário pode
 * escolher "cobrar assim mesmo" (dia sem horas conta a diária cheia, sem hora extra).
 */

function shortDate(iso) {
  const [, m, d] = String(iso).split('-');
  return d && m ? `${d}/${m}` : String(iso);
}

function listDates(dates, max = 4) {
  const shown = dates.slice(0, max).map(shortDate).join(', ');
  return dates.length > max ? `${shown} e mais ${dates.length - max}` : shown;
}

/** true quando falta lançar horas em algum dia que já aconteceu. */
export function shouldBlockPayment(hoursStatus) {
  return Boolean(hoursStatus) && hoursStatus.missing.length > 0;
}

/** Texto do aviso; null quando não há nada a avisar. */
export function buildHoursGateMessage(hoursStatus) {
  if (!hoursStatus) return null;
  const { missing = [], estimated = [] } = hoursStatus;
  if (missing.length === 0 && estimated.length === 0) return null;
  const parts = [];
  if (missing.length > 0) {
    parts.push(
      `${missing.length === 1 ? '1 dia está' : `${missing.length} dias estão`} sem horas lançadas (${listDates(missing)}). `
      + 'Sem horas, o dia entra como diária cheia, sem hora extra.'
    );
  }
  if (estimated.length > 0) {
    parts.push(
      `${estimated.length === 1 ? '1 dia foi fechado' : `${estimated.length} dias foram fechados`} com 12 h automáticas (${listDates(estimated)}).`
    );
  }
  parts.push('Se você trabalhou mais de 12 h em algum dia, lance as horas reais antes de cobrar.');
  return parts.join(' ');
}
