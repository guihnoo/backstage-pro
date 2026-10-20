import { getEventHoursStatus, isCancelledEvent } from './eventFinance';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro'];

/**
 * Resumo do mês em uma linha para o topo do Início.
 * Ex.: "Outubro: 9 eventos · R$ 7.400 recebidos · R$ 2.100 a receber · faltam 2 diárias para a meta"
 */
export function buildMonthSummary(stats = {}, profile = {}, today = new Date()) {
  const recebido = Number(stats.faturamento_pago) || 0;
  const aReceber = Number(stats.a_receber) || 0;
  const eventos = Number(stats.eventos_count) || 0;
  const diarias = Number(stats.diarias_count) || 0;
  const metaReceita = Number(profile?.monthly_goal_revenue) || 0;
  const metaDiarias = Number(profile?.monthly_goal_events) || 0;

  let meta = null;
  if (metaReceita > 0 || metaDiarias > 0) {
    const faltaReceita = Math.max(0, metaReceita - recebido);
    const faltaDiarias = Math.max(0, metaDiarias - diarias);
    if ((metaReceita > 0 && faltaReceita === 0) || (metaReceita === 0 && metaDiarias > 0 && faltaDiarias === 0)) {
      meta = { atingida: true };
    } else {
      meta = {
        atingida: false,
        faltaReceita: metaReceita > 0 ? faltaReceita : null,
        faltaDiarias: metaDiarias > 0 ? faltaDiarias : null,
      };
    }
  }

  const mes = MESES[today.getMonth()];
  return {
    mes: mes.charAt(0).toUpperCase() + mes.slice(1),
    eventos,
    diarias,
    recebido,
    aReceber,
    meta,
  };
}

/** Converte "YYYY-MM-DD" em dias atrás em relação a hoje (local). */
function isoMinusDays(todayIso, n) {
  const d = new Date(todayIso + 'T12:00:00');
  d.setDate(d.getDate() - n);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Dias de trabalho recentes (até `janela` dias atrás, sem contar hoje) que ficaram sem horas.
 * Usado no lembrete "você não lançou as horas de ontem".
 */
export function findRecentMissingHours(events = [], dailyWork = [], todayIso, janela = 3) {
  if (!todayIso) return [];
  const limite = isoMinusDays(todayIso, janela);
  const ontem = isoMinusDays(todayIso, 1);
  const workByEvent = new Map();
  for (const w of dailyWork || []) {
    if (!w?.event_id) continue;
    if (!workByEvent.has(w.event_id)) workByEvent.set(w.event_id, []);
    workByEvent.get(w.event_id).push(w);
  }
  const out = [];
  for (const event of events || []) {
    if (!event?.start_date || isCancelledEvent(event)) continue;
    const end = event.end_date || event.start_date;
    if (end < limite || event.start_date > ontem) continue;
    const status = getEventHoursStatus(event, workByEvent.get(event.id) || [], ontem);
    const dias = status.missing.filter((d) => d >= limite && d <= ontem);
    if (dias.length) out.push({ event, dias });
  }
  return out.sort((a, b) => (b.dias[b.dias.length - 1] || '').localeCompare(a.dias[a.dias.length - 1] || ''));
}
