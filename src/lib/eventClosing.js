/**
 * Fechamento do evento (relatório ao cliente) — um só, no final do evento, com TODOS os dias.
 *
 * Regras (dono, 15/10/2026):
 * - O relatório é do evento inteiro, não de cada dia.
 * - Dia sem horas lançadas entra com a diária combinada e aparece marcado.
 * - O total bate com o "a receber" do app (calculateEventReceivableAmount) + reembolsos.
 *
 * Correção (auditoria 15/10): o PDF antigo somava as horas extras DUAS vezes (o valor do dia
 * já inclui as extras e o PDF somava de novo com a diária do perfil) e ignorava dias sem registro.
 */
import { dedupeWorkByDay, isEstimatedWork, calculateEventReceivableAmount, getEventCacheAmount } from './eventFinance';
import { dailyBaseValue, paymentModelOf, MODELO_HORAS_EXTRAS, isValidRegime } from './workDay';
import { resolveMealPolicy, mealOfDay } from './mealPolicy';

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const dayKey = (w) => (w?.date || w?.work_date ? String(w.date || w.work_date).slice(0, 10) : null);

function eachDay(start, end) {
  const s = Date.parse(String(start || '').slice(0, 10) + 'T00:00:00Z');
  let e = Date.parse(String(end || start || '').slice(0, 10) + 'T00:00:00Z');
  if (Number.isNaN(s)) return [];
  if (Number.isNaN(e) || e < s) e = s;
  const out = [];
  for (let t = s; t <= e && out.length < 400; t += 86400000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

/** Parte do valor do dia que é hora extra (para mostrar separado, sem somar duas vezes). */
function overtimePortion(event, work, base) {
  const hours = Number(work?.overtime_hours) || 0;
  if (hours <= 0 || base <= 0) return 0;
  const extraLigada = typeof work?.hora_extra === 'boolean'
    ? work.hora_extra
    : (!isValidRegime(work?.regime) && paymentModelOf(event) === MODELO_HORAS_EXTRAS);
  if (!extraLigada) return 0;
  return Math.min(money(work.daily_cache), money(hours * (base / 12)));
}

export function buildEventClosing(event, dailyWork = [], expenses = []) {
  // Alimentacao so e cobrada quando o cliente reembolsa (igual ao "a receber").
  const mealCharged = resolveMealPolicy(event) === 'reembolso';
  const totalDias = Math.max(1, eachDay(event?.start_date, event?.end_date || event?.start_date).length);
  // Mesma diária que o "a receber" usa para dia sem registro.
  const base = dailyBaseValue(event) || getEventCacheAmount(event) / totalDias;
  const byDay = new Map();
  for (const w of dedupeWorkByDay(dailyWork || [])) {
    const k = dayKey(w);
    if (k) byDay.set(k, w); // registros sem data (legado) não entram no relatório
  }

  const eventDays = eachDay(event?.start_date, event?.end_date || event?.start_date);
  const inEvent = new Set(eventDays);
  // Dias lançados fora das datas do evento (ex.: montagem na véspera) também entram.
  const outside = [...byDay.keys()].filter((k) => !inEvent.has(k));
  const allDays = [...eventDays, ...outside].sort();

  const rows = allDays.map((date) => {
    const work = byDay.get(date) || null;
    if (!work) {
      return {
        date, work: null, status: 'sem_horas', entry: null, exit: null,
        totalHours: 0, overtimeHours: 0, diaria: money(base), horasExtras: 0,
        alimentacao: 0, subtotal: money(base),
      };
    }
    const valor = money(work.daily_cache || work.daily_rate || 0);
    const he = overtimePortion(event, work, base);
    const alimentacao = mealCharged ? mealOfDay(work) : 0;
    return {
      date, work,
      status: isEstimatedWork(work) ? 'estimado' : 'lancado',
      entry: work.entry_time || null,
      exit: work.exit_time || null,
      totalHours: Number(work.total_hours ?? work.hours_worked) || 0,
      overtimeHours: Number(work.overtime_hours) || 0,
      diaria: money(valor - he),
      horasExtras: he,
      alimentacao,
      subtotal: money(valor + alimentacao),
    };
  });

  // Só cobra do cliente o reembolso que ainda não foi pago.
  const reembolsaveis = (expenses || []).filter((e) => e?.is_reimbursable && !e?.reimbursed);
  const totalDiarias = money(rows.reduce((s, r) => s + r.diaria, 0));
  const totalHorasExtras = money(rows.reduce((s, r) => s + r.horasExtras, 0));
  const totalAlimentacao = money(rows.reduce((s, r) => s + r.alimentacao, 0));
  const totalReembolsos = money(reembolsaveis.reduce((s, e) => s + (Number(e.amount) || 0), 0));
  const totalServicos = money(totalDiarias + totalHorasExtras + totalAlimentacao);

  return {
    base: money(base),
    valorHora: money(base / 12),
    rows,
    semHoras: rows.filter((r) => r.status === 'sem_horas').map((r) => r.date),
    estimados: rows.filter((r) => r.status === 'estimado').map((r) => r.date),
    reembolsaveis,
    totalHoras: Math.round(rows.reduce((s, r) => s + r.totalHours, 0) * 10) / 10,
    totalHorasExtrasQtd: Math.round(rows.reduce((s, r) => s + r.overtimeHours, 0) * 10) / 10,
    totalDiarias,
    totalHorasExtras,
    totalAlimentacao,
    totalReembolsos,
    totalServicos,
    total: money(totalServicos + totalReembolsos),
    // Conferência: o valor dos serviços deve bater com o "a receber" do app.
    aReceberApp: money(calculateEventReceivableAmount(event, dailyWork)),
  };
}
