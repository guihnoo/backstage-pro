import { lazy, Suspense, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useDailyWork } from '@/lib/useDailyWork';
import { isDoneEvent } from '@/lib/eventFinance';
import { buildWorkByEvent, getEventReceivedAmount } from '@/lib/financeMetrics';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { Skeleton } from '@/components/ui/skeleton';

const BrazilVisitedMap = lazy(() => import('@/components/reports/BrazilVisitedMap'));

// "Minha turne" (prototipo All Access): onde voce ja trabalhou e quanto ganhou em cada cidade.
export default function Mapa() {
  const { events, loading: eventsLoading } = useEvents();
  const { clients } = useClients();
  const { dailyWork } = useDailyWork();
  const { formatCurrency, isVisible } = useFinancialVisibility();

  // "Onde você já trabalhou": só shows que já aconteceram
  const activeEvents = useMemo(() => (events || []).filter((e) => isDoneEvent(e)), [events]);
  const workByEvent = useMemo(() => buildWorkByEvent(dailyWork || []), [dailyWork]);

  const cities = useMemo(() => {
    const map = new Map();
    for (const ev of activeEvents) {
      const city = (ev.location_city || '').trim();
      if (!city) continue;
      const key = `${city.toLowerCase()}|${(ev.location_state || '').toUpperCase()}`;
      if (!map.has(key)) map.set(key, { city, uf: (ev.location_state || '').toUpperCase(), shows: [], earned: 0 });
      const item = map.get(key);
      item.shows.push(ev);
      if (ev.payment_status === 'paid') item.earned += getEventReceivedAmount(ev, workByEvent[ev.id] || []);
    }
    return Array.from(map.values())
      .map((c) => ({ ...c, shows: c.shows.sort((a, b) => ((b.start_date || '') > (a.start_date || '') ? 1 : -1)) }))
      .sort((a, b) => b.shows.length - a.shows.length || b.earned - a.earned);
  }, [activeEvents, workByEvent]);

  const states = useMemo(
    () => new Set(activeEvents.map((e) => (e.location_state || '').toUpperCase()).filter(Boolean)),
    [activeEvents],
  );

  const fmtDate = (iso) => {
    const d = iso ? parseISO(iso) : null;
    return d && isValid(d) ? format(d, 'dd MMM', { locale: ptBR }).toUpperCase() : '—';
  };

  return (
    <div className="relative min-h-full overflow-x-clip bg-[#0a0a0a] text-white pb-24">
      <div className="px-4 pt-4 max-w-2xl xl:max-w-6xl mx-auto w-full min-w-0 space-y-3">
        <div>
          <p className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Onde você já trabalhou</p>
          <h1 className="font-poster text-[40px] leading-none uppercase tracking-wide mt-0.5">Minha turnê</h1>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: activeEvents.length, label: 'SHOWS', color: 'text-[#ffd400]' },
            { value: cities.length, label: 'CIDADES', color: 'text-white' },
            { value: states.size, label: 'ESTADOS', color: 'text-white' },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-[10px] bg-[#161616] border border-[#222222] p-2.5">
              {eventsLoading ? (
                <Skeleton className="h-6 w-10" />
              ) : (
                <div className={`font-poster text-[24px] leading-none ${color}`}>{value}</div>
              )}
              <div className="font-tag text-[10px] text-[#a8a8a8] mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div id="mapa-visitado" className="scroll-mt-20">
          <Suspense fallback={<Skeleton className="w-full h-72 rounded-2xl" />}>
            <BrazilVisitedMap events={activeEvents} clients={clients} showTitle={false} />
          </Suspense>
        </div>

        {cities.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Cidade por cidade</h2>
            {cities.map((c) => (
              <div key={`${c.city}-${c.uf}`} className="rounded-[14px] bg-[#161616] border border-[#222222] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-poster text-[22px] leading-none uppercase truncate">{c.city}</div>
                    <div className="font-tag text-[10px] text-[#a8a8a8] mt-1">
                      {c.uf ? `${c.uf} · ` : ''}{c.shows.length} show{c.shows.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-tag text-[9px] text-[#a8a8a8]">GANHOU AQUI</div>
                    <div className="font-poster text-[20px] leading-none text-[#ffd400]">
                      {isVisible ? formatCurrency(c.earned) : '•••••'}
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 space-y-1">
                  {c.shows.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2 text-[13px]">
                      <span className="font-tag text-[10px] text-[#888888] w-14 shrink-0">{fmtDate(ev.start_date)}</span>
                      <span className="font-bold text-white truncate">{ev.title || 'Show'}</span>
                    </div>
                  ))}
                  {c.shows.length > 3 && (
                    <div className="font-tag text-[10px] text-[#888888]">+{c.shows.length - 3} shows</div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
