/**
 * Pendências do usuário — regra ÚNICA usada pela tela /pendencias, pelo selo do Início/Dinheiro
 * e pelos avisos. Só leitura: as gravações ficam na tela, sempre com confirmação do usuário.
 *
 * Grupos:
 *  - receber: trabalho já terminou e não foi pago (dar baixa em vários de uma vez);
 *  - pagosSemValor: marcado como pago sem o valor recebido (fica fora do "Entrou no mês");
 *  - naoRealizados: já passou e ainda está como confirmado/pendente;
 *  - semHoras: dias do trabalho já passados sem horas registradas;
 *  - saidaAberta: entrou (CHEGUEI) e não registrou a saída;
 *  - semNota: trabalho de empresa, já feito, sem nota fiscal registrada.
 */
import { calculateEventReceivableAmount, isCancelledEvent } from './eventFinance';
import { parseTimeToMinutes } from './workDay';

export const DIAS_ESTIMATIVA_RECEBIMENTO = 10;
export const HORAS_ATE_LEMBRAR_SAIDA = 12;
/** Horas que faltam: só trabalhos que terminaram nos últimos 45 dias (igual ao aviso do celular). */
export const HORAS_JANELA_DIAS = 45;

const DAY_MS = 86400000;

function dateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const key = value.slice(0, 10);
  return Number.isFinite(Date.parse(key + 'T00:00:00Z')) ? key : null;
}

export function addDaysISO(iso, days) {
  const d = new Date(Date.parse(iso + 'T00:00:00Z') + days * DAY_MS);
  return d.toISOString().slice(0, 10);
}

const daysBetween = (later, earlier) => Math.round((Date.parse(later + 'T00:00:00Z') - Date.parse(earlier + 'T00:00:00Z')) / DAY_MS);

function eventRange(event) {
  const start = dateKey(event?.start_date) || dateKey(event?.event_date);
  const end = dateKey(event?.end_date) || start;
  return start && end && end >= start ? { start, end } : null;
}

function eventDays(range) {
  const out = [];
  for (let d = range.start; d <= range.end && out.length < 60; d = addDaysISO(d, 1)) out.push(d);
  return out;
}

const workDay = (w) => dateKey(w?.work_date) || dateKey(w?.date);
const hasInvoice = (e) => Boolean(e?.nfe_numero || e?.nf_number || e?.nfe_arquivo_url || e?.nf_issued_at);

/**
 * Data sugerida para dar baixa: trabalho antigo (10+ dias) → fim + 10 dias, marcada como estimada;
 * recente → hoje.
 */
export function suggestedPaidDate(endDate, today) {
  const estimated = addDaysISO(endDate, DIAS_ESTIMATIVA_RECEBIMENTO);
  return estimated <= today ? { date: estimated, estimated: true } : { date: today, estimated: false };
}

/** `now` = Date (para a saída aberta há mais de 12 h). */
export function buildPendencias({ events = [], dailyWork = [], clients = [], today, now = new Date() }) {
  const workByEvent = new Map();
  for (const w of dailyWork || []) {
    if (!w?.event_id) continue;
    if (!workByEvent.has(w.event_id)) workByEvent.set(w.event_id, []);
    workByEvent.get(w.event_id).push(w);
  }
  const clientById = new Map((clients || []).map((c) => [c.id, c]));
  const out = { receber: [], pagosSemValor: [], naoRealizados: [], semHoras: [], saidaAberta: [], semNota: [] };

  for (const event of events || []) {
    if (!event || isCancelledEvent(event)) continue;
    const range = eventRange(event);
    if (!range) continue;
    const work = workByEvent.get(event.id) || [];
    const ended = range.end < today;
    const paid = event.payment_status === 'paid';
    const valorPrevisto = calculateEventReceivableAmount(event, work);
    const base = { event, client: clientById.get(event.client_id) || null, start: range.start, end: range.end, valorPrevisto };

    const semValorRecebido = paid && (event.paid_amount === null || event.paid_amount === undefined || event.paid_amount === '');
    const semValorNenhum = !(valorPrevisto > 0);
    // "Falta o valor": pago sem o valor recebido, ou trabalho já feito sem nenhum cachê cadastrado.
    if (semValorRecebido || (ended && !paid && semValorNenhum)) {
      out.pagosSemValor.push({ ...base, pago: paid });
    } else if (ended && !paid) {
      const sug = suggestedPaidDate(range.end, today);
      out.receber.push({ ...base, diasDesdeFim: daysBetween(today, range.end), dataSugerida: sug.date, dataEstimada: sug.estimated });
    }
    // Lista simples (08/11): "não fechados" e "sem nota" saíram das pendências — o app já trata o
    // trabalho que passou pela data, e a nota fica no Dinheiro › Fiscal. Ficam só para quem consulta.
    if (ended && ['confirmed', 'pending', 'scheduled', 'in_progress'].includes(event.status)) {
      out.naoRealizados.push(base);
    }
    const client = base.client;
    if (ended && !hasInvoice(event) && client && client.client_type !== 'pessoa') out.semNota.push(base);

    // Dias já passados (até ontem) sem horas, só de trabalhos recentes (mesma janela do aviso).
    if (range.end >= addDaysISO(today, -HORAS_JANELA_DIAS)) {
      const registered = new Set(work.map(workDay).filter(Boolean));
      const faltando = eventDays(range).filter((d) => d < today && !registered.has(d));
      if (faltando.length) out.semHoras.push({ ...base, dias: faltando });
    }

    for (const w of work) {
      if (!w.entry_time || w.exit_time) continue;
      const day = workDay(w);
      const entryMin = parseTimeToMinutes(String(w.entry_time).slice(0, 5));
      if (!day || entryMin == null) continue;
      const entryAt = new Date(`${day}T${String(Math.floor(entryMin / 60)).padStart(2, '0')}:${String(entryMin % 60).padStart(2, '0')}:00`);
      const horas = (now.getTime() - entryAt.getTime()) / 3600000;
      if (horas >= HORAS_ATE_LEMBRAR_SAIDA) out.saidaAberta.push({ ...base, work: w, dia: day, horasDesdeEntrada: Math.floor(horas) });
    }
  }

  out.receber.sort((a, b) => a.end.localeCompare(b.end));
  out.semHoras.sort((a, b) => a.end.localeCompare(b.end));
  out.total = out.receber.length + out.pagosSemValor.length + out.semHoras.length + out.saidaAberta.length;
  return out;
}

/** Atualização de "dar baixa": mesma forma do buildMarkPaidUpdate, com a origem da data. */
export function buildBaixaUpdate({ valor, data, estimada }) {
  const amount = Math.round(Number(valor) * 100) / 100;
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError('Informe o valor recebido.');
  if (!dateKey(data)) throw new RangeError('Informe a data do recebimento.');
  return {
    payment_status: 'paid',
    paid: true,
    paid_amount: amount,
    paid_date: data,
    paid_date_meta: estimada
      ? { source: 'estimated', basis: 'end_date', days: DIAS_ESTIMATIVA_RECEBIMENTO, via: 'pendencias' }
      : { source: 'user_confirmed', via: 'pendencias' },
    status: 'completed',
  };
}
