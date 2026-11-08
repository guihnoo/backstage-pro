/**
 * Roadie — retrato da conta do usuário para a IA (08/11). Só leitura, montado no aparelho
 * com as MESMAS regras das telas (Dinheiro, Pendências, horas), para o Roadie nunca contradizer o app.
 * Pequeno o bastante para ir em cada pergunta (dezenas de trabalhos, não milhares).
 */
import { buildFinanceDashboard } from '../financeDashboard';
import { buildPendencias } from '../pendencias';
import { calculateEventReceivableAmount, isCancelledEvent } from '../eventFinance';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const shift = (monthKey, k) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + k, 1));
  return d.toISOString().slice(0, 7);
};
const day = (v) => (typeof v === 'string' ? v.slice(0, 10) : null);
const daysBetween = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000);

export function buildRoadieContext({ events = [], clients = [], dailyWork = [], expenses = [], profile = {}, today, now = new Date(), route = '/' }) {
  const workByEvent = {};
  for (const w of dailyWork || []) {
    if (!w?.event_id) continue;
    (workByEvent[w.event_id] ||= []).push(w);
  }
  const clientName = new Map((clients || []).map((c) => [c.id, c.name || c.company || 'Cliente']));
  const monthKey = today.slice(0, 7);
  const dash = buildFinanceDashboard({ events, clients, expenses, workByEvent, monthKey, today });
  const pend = buildPendencias({ events, dailyWork, clients, today, now });

  const meses = Array.from({ length: 6 }, (_, i) => {
    const m = shift(monthKey, i - 5);
    const d = buildFinanceDashboard({ events, clients, expenses, workByEvent, monthKey: m, today });
    return { mes: m, recebido: d.totals.received, faturado: d.totals.revenue, despesas: d.totals.expenses, trabalhos: d.billedRows.length };
  });

  // Por cliente: o que fez, quanto rendeu, média de cachê, quanto deve e quanto demora para pagar.
  const porCliente = new Map();
  for (const ev of events || []) {
    if (!ev || isCancelledEvent(ev)) continue;
    const id = ev.client_id || 'sem';
    const c = porCliente.get(id) || { cliente: clientName.get(ev.client_id) || 'Sem cliente', trabalhos: 0, total: 0, deve: 0, prazos: [], ultimo: null };
    const end = day(ev.end_date) || day(ev.start_date);
    const valor = calculateEventReceivableAmount(ev, workByEvent[ev.id] || []);
    c.trabalhos += 1;
    c.total += valor;
    if (end && end < today && ev.payment_status !== 'paid') c.deve += valor;
    if (ev.payment_status === 'paid' && day(ev.paid_date) && end && ev.paid_date_meta?.source !== 'estimated') {
      c.prazos.push(daysBetween(day(ev.paid_date), end));
    }
    if (end && end <= today && (!c.ultimo || end > c.ultimo)) c.ultimo = end;
    porCliente.set(id, c);
  }
  const clientesResumo = [...porCliente.values()].map((c) => ({
    cliente: c.cliente,
    trabalhos: c.trabalhos,
    total: r2(c.total),
    media_por_trabalho: r2(c.total / Math.max(1, c.trabalhos)),
    deve_agora: r2(c.deve),
    prazo_medio_pagamento_dias: c.prazos.length ? Math.round(c.prazos.reduce((a, b) => a + b, 0) / c.prazos.length) : null,
    ultimo_trabalho: c.ultimo,
  })).sort((a, b) => b.total - a.total).slice(0, 15);

  const proximos = (events || [])
    .filter((ev) => !isCancelledEvent(ev) && (day(ev.end_date) || day(ev.start_date)) >= today)
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)))
    .slice(0, 10)
    .map((ev) => ({ id: ev.id, titulo: ev.title, cliente: clientName.get(ev.client_id) || 'Sem cliente', inicio: day(ev.start_date), fim: day(ev.end_date), cache_dia: Number(ev.daily_cache_value) || null, valor: calculateEventReceivableAmount(ev, workByEvent[ev.id] || []) }));

  const horasMes = (dailyWork || []).filter((w) => String(w.work_date || w.date || '').startsWith(monthKey))
    .reduce((s, w) => s + (Number(w.total_hours ?? w.hours_worked) || 0), 0);

  return {
    hoje: today,
    tela_atual: route,
    usuario: {
      nome: profile?.name || profile?.full_name || null,
      funcao: profile?.category_label || profile?.category || 'técnico de eventos',
      meta_faturamento_mes: Number(profile?.monthly_goal_revenue) || null,
      meta_diarias_mes: Number(profile?.monthly_goal_events) || null,
    },
    mes_atual: {
      mes: monthKey,
      entrou: dash.totals.received,
      faturado: dash.totals.revenue,
      despesas: dash.totals.expenses,
      resultado_caixa: dash.totals.cash,
      horas: r2(horasMes),
    },
    a_receber_total: r2(pend.receber.reduce((s, it) => s + it.valorPrevisto, 0)),
    a_receber: pend.receber.slice(0, 15).map((it) => ({ id: it.event.id, trabalho: it.event.title, cliente: clientName.get(it.event.client_id) || 'Sem cliente', fim: it.end, dias_desde_fim: it.diasDesdeFim, valor: it.valorPrevisto })),
    pendencias: {
      confirmar_recebimento: pend.receber.length,
      falta_valor: pend.pagosSemValor.map((it) => `${it.event.title} (${it.end})`),
      falta_horas: pend.semHoras.map((it) => `${it.event.title}: ${it.dias.length} dia(s)`),
      saida_aberta: pend.saidaAberta.map((it) => `${it.event.title}: entrou ${String(it.work.entry_time).slice(0, 5)}, ${it.horasDesdeEntrada} h`),
    },
    ultimos_6_meses: meses,
    clientes: clientesResumo,
    proximos_trabalhos: proximos,
  };
}
