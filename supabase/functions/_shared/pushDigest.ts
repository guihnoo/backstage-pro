type EventRow = {
  id: string;
  title: string;
  client_id: string | null;
  start_date: string;
  end_date: string | null;
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
  const todayStr = toDateStr(today);
  const tomorrowStr = toDateStr(addDays(today, 1));
  const clientMap = new Map(clients.map((c) => [c.id, c.name || 'Cliente']));
  const out: PushPayload[] = [];

  for (const ev of events) {
    if (ev.status === 'cancelled') continue;
    const startStr = ev.start_date?.split('T')[0];
    const endStr = (ev.end_date || ev.start_date)?.split('T')[0];
    if (!startStr) continue;
    const clientName = (ev.client_id && clientMap.get(ev.client_id)) || 'Cliente';

    if (prefs.push_events !== false) {
      if (startStr <= todayStr && endStr >= todayStr) {
        out.push({
          key: `today:${ev.id}`,
          type: 'today_event',
          priority: 'urgent',
          title: 'Hoje em cena',
          body: `${ev.title} com ${clientName}.`,
          url: '/calendar',
        });
      } else if (startStr === tomorrowStr) {
        out.push({
          key: `tomorrow:${ev.id}`,
          type: 'event_reminder',
          priority: 'high',
          title: 'Show amanhã',
          body: `${ev.title} — confirme com ${clientName}.`,
          url: '/calendar',
        });
      }
    }

    if (prefs.push_payments !== false && ev.payment_status !== 'paid' && endStr) {
      const endDate = parseDate(endStr);
      if (startOfDayUTC(endDate) < startOfDayUTC(today)) {
        const daysLate = daysBetween(endDate, today);
        const amount = getEventAmount(ev);
        out.push({
          key: `payment:${ev.id}`,
          type: 'payment_reminder',
          priority: daysLate > 7 ? 'urgent' : 'high',
          title: 'Pagamento pendente',
          body: `${ev.title} · ${formatBRL(amount)} · ${daysLate}d em atraso.`,
          url: '/reports',
        });
      }
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
