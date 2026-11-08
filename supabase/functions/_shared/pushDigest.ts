type EventRow = {
  id: string;
  title: string;
  client_id: string | null;
  start_date: string;
  end_date: string | null;
  event_date?: string | null;
  payment_due_date?: string | null;
  payment_status: string | null;
  status: string | null;
  daily_cache_value: number | null;
  actual_revenue: number | null;
  estimated_revenue: number | null;
  nfe_numero?: string | null;
  nf_number?: string | null;
  nfe_arquivo_url?: string | null;
  nf_issued_at?: string | null;
};

type ClientRow = { id: string; name: string | null; client_type?: string | null };

export type WorkRow = {
  id: string;
  event_id: string | null;
  work_date?: string | null;
  date?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
};

/** Depois de 12 h da entrada sem saída, lembra a cada 3 h até registrar. */
export const PUSH_EXIT_AFTER_HOURS = 12;
export const PUSH_EXIT_REPEAT_HOURS = 3;
/** Horas que faltam: só trabalhos que terminaram nos últimos 45 dias (não lembrar de 2024). */
export const PUSH_HOURS_LOOKBACK_DAYS = 45;
type ProfileRow = { monthly_goal_events: number | null };

export type PushPayload = {
  key: string;
  type: string;
  priority: 'urgent' | 'high' | 'medium';
  title: string;
  body: string;
  url: string;
};

const DAY_MS = 86_400_000;
export const PUSH_PAYMENT_REMINDER_START_DAYS = 10;

const missing = (value: unknown) => value === null || value === undefined || value === '';

function dateKey(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return null;
  const key = value.slice(0, 10);
  const parsed = new Date(key + 'T00:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== key) return null;
  if (value.length > 10 && !Number.isFinite(Date.parse(value))) return null;
  return key;
}

/**
 * Server-local equivalent of the app reminder policy, covered by parity tests.
 * Ten days after completion is a reminder threshold, never an inferred due date.
 * No src import: this module must remain independently deployable in Deno.
 */
export function getPushPaymentReminderTiming(event: Partial<EventRow> | null | undefined, todayISO: unknown) {
  if (!event || event.payment_status === 'paid' || ['cancelled', 'cancelado'].includes(event.status || '')) return null;
  const today = dateKey(todayISO);
  const startDate = dateKey(missing(event.start_date) ? event.event_date : event.start_date);
  const endDate = missing(event.end_date) ? startDate : dateKey(event.end_date);
  if (!today || !startDate || !endDate || endDate < startDate || endDate >= today) return null;
  const daysSinceEnd = (Date.parse(today + 'T00:00:00Z') - Date.parse(endDate + 'T00:00:00Z')) / DAY_MS;
  if (daysSinceEnd < PUSH_PAYMENT_REMINDER_START_DAYS) return null;
  const dueDate = dateKey(event.payment_due_date);
  const isOverdue = Boolean(dueDate && dueDate < today);
  return {
    endDate, daysSinceEnd, dueDate, isOverdue,
    daysOverdue: isOverdue ? (Date.parse(today + 'T00:00:00Z') - Date.parse(dueDate + 'T00:00:00Z')) / DAY_MS : 0,
  };
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

function parseDate(str: string) {
  const [y, m, day] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

function daysBetween(a: Date, b: Date) {
  const ms = startOfDayUTC(b).getTime() - startOfDayUTC(a).getTime();
  return Math.floor(ms / 86400000);
}

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function calcEventDays(event: EventRow) {
  if (!event.start_date) return 1;
  const start = parseDate(event.start_date.split('T')[0]);
  const end = parseDate((event.end_date || event.start_date).split('T')[0]);
  return Math.max(1, daysBetween(start, end) + 1);
}

function getEventAmount(event: EventRow) {
  if (Number(event.actual_revenue) > 0) return Number(event.actual_revenue);
  if (Number(event.estimated_revenue) > 0) return Number(event.estimated_revenue);
  if (Number(event.daily_cache_value) > 0) {
    return Math.round(Number(event.daily_cache_value) * calcEventDays(event) * 100) / 100;
  }
  return 0;
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function buildPushDigest({
  events,
  clients,
  profile,
  diariasCount = 0,
  today = new Date(),
  prefs = { push_events: true, push_payments: true, push_goals: false },
  work = [],
  mode = 'digest',
}: {
  events: EventRow[];
  clients: ClientRow[];
  profile: ProfileRow | null;
  diariasCount?: number;
  today?: Date;
  prefs?: { push_events?: boolean; push_payments?: boolean; push_goals?: boolean };
  work?: WorkRow[];
  /** 'digest' = 18h (tudo); 'brief' = 8h, a Escala do dia (um aviso só); 'exit' = de hora em hora, só a saída. */
  mode?: 'digest' | 'exit' | 'brief';
}): PushPayload[] {
  if (!Number.isFinite(today.getTime())) return [];
  const todayStr = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(today);
  const tomorrowStr = toDateStr(addDays(parseDate(todayStr), 1));
  const clientMap = new Map(clients.map((c) => [c.id, c.name || 'Cliente']));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const eventById = new Map(events.map((e) => [e.id, e]));
  const out: PushPayload[] = [];
  let paymentTotal = 0;

  // Saída esquecida (CHEGUEI sem BATER SAÍDA): 12 h depois da entrada e a cada 3 h até registrar.
  if (prefs.push_events !== false) {
    for (const w of work) {
      if (!w?.entry_time || w.exit_time || !w.event_id) continue;
      const day = dateKey(w.work_date || w.date);
      const hhmm = String(w.entry_time).slice(0, 5);
      if (!day || !/^\d{2}:\d{2}$/.test(hhmm)) continue;
      // Horário do Brasil (UTC-3, sem horário de verão desde 2019).
      const entryAt = Date.parse(`${day}T${hhmm}:00-03:00`);
      const hours = (today.getTime() - entryAt) / 3_600_000;
      if (!(hours >= PUSH_EXIT_AFTER_HOURS) || hours > 72) continue;
      const slot = Math.floor((hours - PUSH_EXIT_AFTER_HOURS) / PUSH_EXIT_REPEAT_HOURS);
      const ev = eventById.get(w.event_id);
      out.push({
        key: `exit:${w.id}:${slot}`,
        type: 'exit_reminder',
        priority: 'urgent',
        title: 'Registre sua saída',
        body: `${ev?.title || 'Trabalho'}: entrada às ${hhmm}, ${Math.floor(hours)} h sem saída. Toque para registrar.`,
        url: '/pendencias?grupo=saidaAberta',
      });
    }
  }
  if (mode === 'exit') return out.slice(0, 3);

  // Horas que faltam: dias já passados de trabalhos recentes sem registro — todo dia até registrar.
  if (prefs.push_events !== false) {
    const workDays = new Map<string, Set<string>>();
    for (const w of work) {
      const day = dateKey(w?.work_date || w?.date);
      if (!w?.event_id || !day) continue;
      if (!workDays.has(w.event_id)) workDays.set(w.event_id, new Set());
      workDays.get(w.event_id)!.add(day);
    }
    const oldest = toDateStr(addDays(parseDate(todayStr), -PUSH_HOURS_LOOKBACK_DAYS));
    for (const ev of events) {
      if (['cancelled', 'cancelado'].includes(ev.status || '')) continue;
      const startStr = dateKey(missing(ev.start_date) ? ev.event_date : ev.start_date);
      const endStr = missing(ev.end_date) ? startStr : dateKey(ev.end_date);
      if (!startStr || !endStr || endStr < startStr || endStr < oldest) continue;
      const have = workDays.get(ev.id) || new Set();
      let missingDays = 0;
      for (let d = parseDate(startStr), i = 0; toDateStr(d) < todayStr && toDateStr(d) <= endStr && i < 60; d = addDays(d, 1), i++) {
        if (!have.has(toDateStr(d))) missingDays += 1;
      }
      if (!missingDays) continue;
      out.push({
        key: `hours:${ev.id}`,
        type: 'hours_reminder',
        priority: 'high',
        title: 'Registre as horas',
        body: `${ev.title}: ${missingDays} dia${missingDays > 1 ? 's' : ''} sem horas registradas.`,
        url: '/pendencias?grupo=semHoras',
      });
    }
  }

  for (const ev of events) {
    if (['cancelled', 'cancelado'].includes(ev.status || '')) continue;
    const startStr = dateKey(missing(ev.start_date) ? ev.event_date : ev.start_date);
    const endStr = missing(ev.end_date) ? startStr : dateKey(ev.end_date);
    if (!startStr || !endStr || endStr < startStr) continue;
    const clientName = (ev.client_id && clientMap.get(ev.client_id)) || 'Cliente';

    if (prefs.push_events !== false) {
      if (startStr <= todayStr && endStr >= todayStr) {
        out.push({
          key: `today:${ev.id}`,
          type: 'today_event',
          priority: 'urgent',
          title: 'Hoje em cena',
          body: `${ev.title} com ${clientName}.`,
          // Início: é lá que ficam o CHEGUEI / BATER SAÍDA do show de hoje.
          url: '/',
        });
      } else if (startStr === tomorrowStr) {
        out.push({
          key: `tomorrow:${ev.id}`,
          type: 'event_reminder',
          priority: 'high',
          title: 'Show amanhã',
          body: `${ev.title} — confirme com ${clientName}.`,
          url: `/calendar?event=${ev.id}`,
        });
      }
    }

    const paymentTiming = prefs.push_payments !== false ? getPushPaymentReminderTiming(ev, todayStr) : null;
    if (paymentTiming) {
      const amount = getEventAmount(ev);
      paymentTotal += amount;
      const dueMessage = paymentTiming.isOverdue
        ? `Vencimento ultrapassado há ${paymentTiming.daysOverdue} dias.`
        : paymentTiming.dueDate
          ? `Vencimento em ${paymentTiming.dueDate.split('-').reverse().join('/')}.`
          : 'Sem vencimento informado.';
      out.push({
        key: `payment:${ev.id}`,
        type: 'payment_reminder',
        priority: paymentTiming.isOverdue ? 'urgent' : 'high',
        title: paymentTiming.isOverdue ? 'Pagamento vencido' : 'Pagamento pendente',
        body: `${ev.title} · ${formatBRL(amount)} · encerrado há ${paymentTiming.daysSinceEnd} dias. ${dueMessage}`,
        url: '/pendencias?grupo=receber',
      });
    }
  }

  if (prefs.push_goals) {
    const meta = Number(profile?.monthly_goal_events) || 10;
    const remaining = meta - (Number(diariasCount) || 0);
    if (meta > 0 && remaining > 0 && remaining <= 2) {
      out.push({
        key: `goal:diarias:${todayStr.slice(0, 7)}`,
        type: 'goal_reminder',
        priority: 'medium',
        title: 'Meta quase lá',
        body: `Faltam ${remaining} diária(s) para sua meta do mês.`,
        url: '/goals',
      });
    }
  }

  const order = { urgent: 0, high: 1, medium: 2 };
  if (mode === 'brief') return buildEscalaDoDia(out, paymentTotal, todayStr);
  return out
    .sort((a, b) => order[a.priority] - order[b.priority])
    .slice(0, 4);
}

/**
 * Roadie fase 3 (08/11): "Escala do dia" — às 8h, um aviso só com o que importa hoje
 * (trabalho de hoje, amanhã, horas e pagamentos). A saída esquecida continua separada e urgente.
 */
export function buildEscalaDoDia(items: PushPayload[], paymentTotal: number, todayStr: string): PushPayload[] {
  const exits = items.filter((p) => p.type === 'exit_reminder').slice(0, 2);
  const hoje = items.filter((p) => p.type === 'today_event').map((p) => p.body.replace(/\.$/, ''));
  const amanha = items.filter((p) => p.type === 'event_reminder').length;
  const horas = items.filter((p) => p.type === 'hours_reminder').length;
  const pagamentos = items.filter((p) => p.type === 'payment_reminder').length;
  const partes: string[] = [];
  if (hoje.length) partes.push(`Hoje: ${hoje.slice(0, 2).join(' · ')}${hoje.length > 2 ? ` +${hoje.length - 2}` : ''}.`);
  else partes.push('Hoje: dia livre.');
  if (amanha) partes.push(`Amanhã: ${amanha} trabalho${amanha > 1 ? 's' : ''}.`);
  if (horas) partes.push(`${horas} trabalho${horas > 1 ? 's' : ''} sem horas.`);
  if (pagamentos) partes.push(`${pagamentos} para receber (${formatBRL(paymentTotal)}).`);
  if (!hoje.length && !amanha && !horas && !pagamentos) return exits;
  const url = horas || pagamentos ? '/pendencias' : '/';
  return [...exits, {
    key: `escala:${todayStr}`,
    type: 'daily_brief',
    priority: 'high',
    title: hoje.length ? 'Escala do dia 🎛️' : 'Escala do dia',
    body: partes.join(' '),
    url,
  }];
}
