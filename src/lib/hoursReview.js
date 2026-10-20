/**
 * Lote 4 — revisão do passado e telemetria de horas.
 * Nada aqui grava no banco: só aponta possíveis erros para o usuário decidir
 * caso a caso (decisão do dono, 13/10/2026) e conta dias lançados x estimados.
 */
import { computeWorkDay, isSameEntryExit, isValidRegime } from './workDay';
import { isEstimatedWork, calculateEventReceivableAmount, isCancelledEvent, dedupeWorkByDay } from './eventFinance';
import { todayLocalISO } from '@/components/utils/dateUtils';

const TOLERANCIA = 0.5; // R$ — evita apontar diferença de arredondamento

const dayKey = (w) => (w?.date || w?.work_date ? String(w.date || w.work_date).slice(0, 10) : null);
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const TIPOS_PROBLEMA = {
  dia_repetido: 'Dia lançado mais de uma vez',
  zero_horas_cobrado: 'Entrada igual à saída (0 h) com valor cobrado',
  valor_diferente: 'Valor do dia diferente da regra atual',
  recebido_a_menos: 'Recebido menos que o valor do evento',
};

/**
 * Lista possíveis erros em eventos que já terminaram.
 * Cada item: { eventId, event, date, tipo, titulo, valorGravado, valorRegraAtual, pago }.
 */
export function findHoursIssues(events = [], dailyWork = [], { today = todayLocalISO() } = {}) {
  const workByEvent = new Map();
  for (const w of dailyWork || []) {
    if (!w?.event_id) continue;
    if (!workByEvent.has(w.event_id)) workByEvent.set(w.event_id, []);
    workByEvent.get(w.event_id).push(w);
  }

  const issues = [];
  for (const event of events || []) {
    if (!event?.id || isCancelledEvent(event)) continue;
    const end = String(event.end_date || event.start_date || '').slice(0, 10);
    if (!end || end >= today) continue; // só eventos que já terminaram
    const work = workByEvent.get(event.id) || [];
    const pago = event.payment_status === 'paid';
    const base = { eventId: event.id, event, pago };

    // 1) mesmo dia lançado mais de uma vez (somava em dobro)
    const byDay = new Map();
    for (const w of work) {
      const k = dayKey(w);
      if (!k) continue;
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(w);
    }
    for (const [date, rows] of byDay) {
      if (rows.length > 1) {
        issues.push({
          ...base, date, tipo: 'dia_repetido', titulo: TIPOS_PROBLEMA.dia_repetido,
          valorGravado: money(rows.reduce((s, w) => s + (Number(w.daily_cache) || 0), 0)),
          valorRegraAtual: money(dedupeWorkByDay(rows).reduce((sum, w) => sum + (Number(w.daily_cache) || 0), 0)),
          registros: rows.length,
        });
      }
    }

    // 2) e 3) cada dia com entrada e saída, recalculado pela regra atual
    for (const w of work) {
      if (!w.entry_time || !w.exit_time || isEstimatedWork(w)) continue;
      const gravado = money(w.daily_cache);
      const same = isSameEntryExit(w.entry_time, w.exit_time);
      const hours = Number(w.total_hours ?? w.hours_worked) || 0;
      if (same && hours === 0 && gravado > 0) {
        issues.push({
          ...base, date: dayKey(w), tipo: 'zero_horas_cobrado', titulo: TIPOS_PROBLEMA.zero_horas_cobrado,
          valorGravado: gravado, valorRegraAtual: 0, workId: w.id,
        });
        continue;
      }
      const atual = computeWorkDay({
        event,
        entry: w.entry_time,
        exit: w.exit_time,
        nextDay: same && hours >= 24,
        ...(isValidRegime(w.regime) ? { regime: w.regime, horaExtra: Boolean(w.hora_extra) } : {}),
      }).cache;
      if (Math.abs(atual - gravado) > TOLERANCIA) {
        issues.push({
          ...base, date: dayKey(w), tipo: 'valor_diferente', titulo: TIPOS_PROBLEMA.valor_diferente,
          valorGravado: gravado, valorRegraAtual: money(atual), workId: w.id,
        });
      }
    }

    // 4) evento pago com valor abaixo do que a regra atual calcula (só conferência)
    const pagoValor = Number(event.paid_amount) || 0;
    if (pago && pagoValor > 0) {
      const devido = money(calculateEventReceivableAmount(event, work));
      if (devido - pagoValor > TOLERANCIA) {
        issues.push({
          ...base, date: end, tipo: 'recebido_a_menos', titulo: TIPOS_PROBLEMA.recebido_a_menos,
          valorGravado: money(pagoValor), valorRegraAtual: devido,
        });
      }
    }
  }

  return issues.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/**
 * Telemetria: dias lançados x estimados por mês, contando só a partir de `since`
 * (data em que o Lote 2 foi ativado). Antes disso a marca "estimada" não existia.
 */
export function hoursOriginStats(dailyWork = [], since, { months = 6, today = todayLocalISO() } = {}) {
  if (!since) return null;
  const sinceKey = String(since).slice(0, 10);
  const parsedSince = Date.parse(sinceKey + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sinceKey) || !Number.isFinite(parsedSince)
      || new Date(parsedSince).toISOString().slice(0, 10) !== sinceKey) return null;

  const [y, m] = today.split('-').map(Number);
  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    buckets.push({ month: d.toISOString().slice(0, 7), lancados: 0, estimados: 0 });
  }
  const byMonth = new Map(buckets.map((b) => [b.month, b]));

  // Cards e barras usam a mesma janela. Um reenvio do mesmo dia nao vira um
  // dia extra; dias de eventos diferentes continuam sendo trabalhos distintos.
  const periodStart = sinceKey > (buckets[0]?.month + '-01') ? sinceKey : buckets[0]?.month + '-01';
  const grouped = new Map();
  const legacy = [];
  for (const w of dailyWork || []) {
    if (!w) continue;
    if (!w.event_id) { legacy.push(w); continue; }
    if (!grouped.has(w.event_id)) grouped.set(w.event_id, []);
    grouped.get(w.event_id).push(w);
  }
  const uniqueDays = [...legacy, ...[...grouped.values()].flatMap((work) => dedupeWorkByDay(work))];
  const rows = uniqueDays.filter((w) => {
    const k = dayKey(w);
    return k && k >= sinceKey && k <= today && byMonth.has(k.slice(0, 7));
  });

  let somaLancados = 0; let qtdLancados = 0;
  let somaEstimados = 0; let qtdEstimados = 0;
  let horasExtras = 0;
  for (const w of rows) {
    const b = byMonth.get(dayKey(w).slice(0, 7));
    const estimado = isEstimatedWork(w);
    if (b) b[estimado ? 'estimados' : 'lancados'] += 1;
    if (estimado) { somaEstimados += Number(w.daily_cache) || 0; qtdEstimados += 1; }
    else {
      somaLancados += Number(w.daily_cache) || 0; qtdLancados += 1;
      horasExtras += Number(w.overtime_hours) || 0;
    }
  }

  return {
    since: sinceKey,
    periodStart,
    months: buckets,
    totalLancados: qtdLancados,
    totalEstimados: qtdEstimados,
    mediaLancado: qtdLancados ? money(somaLancados / qtdLancados) : 0,
    mediaEstimado: qtdEstimados ? money(somaEstimados / qtdEstimados) : 0,
    horasExtrasLancadas: Math.round(horasExtras * 10) / 10,
  };
}
