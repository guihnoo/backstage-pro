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
};

type ClientRow = { id: string; name: string | null };
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
}: {
  events: EventRow[];
  clients: ClientRow[];
  profile: ProfileRow | null;
  diariasCount?: number;
  today?: Date;
  prefs?: { push_events?: boolean; push_payments?: boolean; push_goals?: boolean };
}): PushPayload[] {
  if (!Number.isFinite(today.getTime())) return [];
  const todayStr = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(today);
  const tomorrowStr = toDateStr(addDays(parseDate(todayStr), 1));
  const clientMap = new Map(clients.map((c) => [c.id, c.name || 'Cliente']));
  const out: PushPayload[] = [];

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
        url: '/reports?aba=receber',
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
  return out
    .sort((a, b) => order[a.priority] - order[b.priority])
    .slice(0, 3);
}
