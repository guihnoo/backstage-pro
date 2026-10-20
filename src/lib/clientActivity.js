/**
 * Regra UNICA de cliente ativo (missao ed8a1: Codex propos, Antigravity aprovou, Claude revisou).
 * Ativo = tem evento nao cancelado que ja comecou ha 0 a 90 dias (inclusive).
 * Evento futuro nao ativa; data invalida e ignorada. Antes havia 4 regras (6 meses, 30, 90 e >=90 dias).
 */
import { todayLocalISO } from '@/components/utils/dateUtils';

export const ACTIVE_CLIENT_DAYS = 90;
const DAY_MS = 86400000;
const spFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

function dayNumber(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const t = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString().slice(0, 10) === value ? t / DAY_MS : null;
}

/** Dia do evento em Sao Paulo ('YYYY-MM-DD'), ou null se a data for invalida. */
export function eventDay(value) {
  if (typeof value !== 'string') return null;
  if (dayNumber(value) !== null) return value;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) return null;
  if (dayNumber(value.slice(0, 10)) === null) return null;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  const p = Object.fromEntries(spFormatter.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

const isCancelled = (e) => e?.status === 'cancelled' || e?.status === 'cancelado';

export function getClientActivity(events = [], today = todayLocalISO()) {
  const todayDay = dayNumber(today);
  let lastEventDate = null;
  let lastDay = null;
  if (todayDay !== null) {
    for (const ev of events || []) {
      if (!ev || isCancelled(ev)) continue;
      const date = eventDay(ev.start_date);
      const day = dayNumber(date);
      if (day === null || day > todayDay) continue;
      if (lastDay === null || day > lastDay) { lastDay = day; lastEventDate = date; }
    }
  }
  const daysSinceLastEvent = lastDay === null ? null : todayDay - lastDay;
  return {
    lastEventDate,
    daysSinceLastEvent,
    isActive: daysSinceLastEvent !== null && daysSinceLastEvent <= ACTIVE_CLIENT_DAYS,
  };
}
