import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { useUserSettings } from '@/lib/useUserSettings';
import { googleBusyDays } from '@/lib/googleCalendarApi';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
// Tocar de um dia para outro e voltar não deve chamar o Google toda vez
const CACHE_MS = 2 * 60 * 1000;
const cache = new Map();

/** Aviso no "Novo trabalho": compromissos do Google nos dias escolhidos. */
export default function GoogleBusyWarning({ startDate, endDate }) {
  const { settings } = useUserSettings();
  const enabled = Boolean(settings?.google_calendar_connected) && settings?.google_busy_check_enabled !== false;
  const start = String(startDate || '').slice(0, 10);
  const end = String(endDate || startDate || '').slice(0, 10);
  const [busy, setBusy] = useState([]);

  useEffect(() => {
    if (!enabled || !ISO_DAY.test(start) || !ISO_DAY.test(end) || end < start) {
      setBusy([]);
      return undefined;
    }
    const key = `${start}|${end}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      setBusy(hit.busy);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await googleBusyDays(start, end);
      if (cancelled) return;
      const list = data?.success ? data.busy || [] : [];
      cache.set(key, { at: Date.now(), busy: list });
      setBusy(list);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, start, end]);

  if (!enabled || busy.length === 0) return null;
  const multiDay = start !== end;

  return (
    <div className="rounded-[12px] bg-[#1a1a1a] px-3 py-2.5 text-xs" style={{ borderLeft: '4px solid #ffd400' }} role="status">
      <p className="font-extrabold text-white text-sm flex items-center gap-1.5">
        <CalendarClock className="w-4 h-4 text-[#ffd400] shrink-0" aria-hidden />
        Dia ocupado no Google
      </p>
      <div className="space-y-0.5 mt-1">
        {busy.slice(0, 3).map((item) => (
          <p key={item.id} className="text-[#c8c8c8] truncate">
            {item.title} — {multiDay ? `${format(parseISO(item.start_date), 'dd/MM')} · ` : ''}
            {item.all_day ? 'dia todo' : `${item.start_time}${item.end_time ? `–${item.end_time}` : ''}`}
          </p>
        ))}
        {busy.length > 3 && <p className="text-[#888888]">+{busy.length - 3} mais…</p>}
      </div>
    </div>
  );
}
