import { useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateEventReceivableAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import EventHeading from '@/components/events/EventHeading';
import { buildClientMap, resolveClientForEvent } from '@/lib/eventDisplay';

// Mesmas cores da legenda da Agenda (All Access): amarelo confirmado, rosa a receber, cinza o resto.
const STATUS_CONFIG_BASE = {
  confirmed: { label: 'Confirmado', color: 'text-[#ffd400]', bg: 'bg-[#ffd400]/10 border-[#ffd400]/20', dot: 'bg-[#ffd400]' },
  scheduled: { label: 'Agendado', color: 'text-[#a8a8a8]', bg: 'bg-[#222222] border-[#333333]', dot: 'bg-[#a8a8a8]' },
  pending:   { label: 'Pendente', color: 'text-[#a8a8a8]', bg: 'bg-[#222222] border-[#333333]', dot: 'bg-[#a8a8a8]' },
};

const STATUS_CONFIG_COMPLETED = {
  label: 'A receber',
  color: 'text-[#ff2e88]',
  bg: 'bg-[#ff2e88]/10 border-[#ff2e88]/20',
  dot: 'bg-[#ff2e88]',
};

function getStatusKey(ev) {
  const s = ev.status || 'scheduled';
  if (s === 'cancelled') return null;
  if (s === 'completed' && ev.payment_status !== 'paid') return 'completed';
  if (s === 'completed') return null;
  return STATUS_CONFIG_BASE[s] ? s : 'scheduled';
}

function getStatusConfig() {
  return {
    ...STATUS_CONFIG_BASE,
    completed: STATUS_CONFIG_COMPLETED,
  };
}

// compact: so os totais de 30/60/90 dias (a lista de shows ja aparece na aba "A receber").
export default function CashflowForecast({ events = [], work = [], clients = [], compact = false }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const STATUS_CONFIG = useMemo(() => getStatusConfig(), []);
  const clientMap = useMemo(() => buildClientMap(clients), [clients]);

  const workByEvent = useMemo(() => {
    const map = {};
    work.forEach(w => {
      if (!w.event_id) return;
      if (!map[w.event_id]) map[w.event_id] = [];
      map[w.event_id].push(w);
    });
    return map;
  }, [work]);

  const today = startOfDay(new Date());

  // Eventos futuros ou concluídos não pagos relevantes
  const forecastEvents = useMemo(() => {
    const cutoff = addDays(today, 90);
    return events
      .filter(ev => {
        if (!ev.start_date) return false;
        const statusKey = getStatusKey(ev);
        if (!statusKey) return false;
        const date = parseISO(ev.start_date);
        // completed+unpaid podem ser passados mas ainda contam como a receber
        if (statusKey === 'completed') return true;
        return !isBefore(date, today) && !isAfter(date, cutoff);
      })
      .map(ev => {
        const wk = workByEvent[ev.id] || [];
        const workForEvent = wk;
        const value = calculateEventReceivableAmount(ev, workForEvent);
        return { ...ev, _value: value, _statusKey: getStatusKey(ev) };
      })
      .filter(ev => ev._value > 0)
      .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  }, [events, workByEvent, today]);

  // KPIs: total em 30 / 60 / 90 dias
  const kpis = useMemo(() => {
    const inDays = (n) => {
      const limit = addDays(today, n);
      return forecastEvents
        .filter(ev => {
          const d = parseISO(ev.start_date);
          return !isAfter(d, limit) || ev._statusKey === 'completed';
        })
        .reduce((s, ev) => s + ev._value, 0);
    };
    return { d30: inDays(30), d60: inDays(60), d90: inDays(90) };
  }, [forecastEvents, today]);

  // Agrupar por mês (3 meses)
  const months = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const monthDate = addMonths(today, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, 'MMMM yyyy', { locale: ptBR });
      const labelShort = format(monthDate, 'MMM yy', { locale: ptBR });
      const evs = forecastEvents.filter(ev => {
        if (ev._statusKey === 'completed') return i === 0;
        const d = parseISO(ev.start_date);
        return isWithinInterval(d, { start, end });
      });
      const total = evs.reduce((s, ev) => s + ev._value, 0);
      return { label, labelShort, evs, total, isCurrentMonth: i === 0 };
    });
  }, [forecastEvents, today]);

  const hasAnyEvents = forecastEvents.length > 0;

  if (!hasAnyEvents) {
    return (
      <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4">
        <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8]">PREVISÃO · PRÓXIMOS 90 DIAS</div>
        <p className="text-sm text-[#c8c8c8] mt-1.5">Nenhum show com valor marcado para os próximos 90 dias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header (All Access) */}
      <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] pt-2">PREVISÃO · PRÓXIMOS 90 DIAS</div>

      {/* KPI Pills */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'até 30 dias', value: kpis.d30, color: 'text-[#ffd400]' },
          { label: 'até 60 dias', value: kpis.d60, color: 'text-white' },
          { label: 'até 90 dias', value: kpis.d90, color: 'text-white' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-[10px] bg-[#161616] border border-[#222222] p-2">
            <p className={`font-poster text-[18px] leading-none truncate ${color}`}>
              {isVisible ? formatCurrency(value) : '••••'}
            </p>
            <p className="font-tag text-[10px] uppercase text-[#a8a8a8] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly sections */}
      {!compact && (<>
      <div className="space-y-2">
        {months.map(({ label, evs, total, isCurrentMonth }) => {
          if (!evs.length) return null;
          return (
            <div key={label} className="rounded-2xl bg-[#161616] border border-[#222222] overflow-hidden">
              {/* Month header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#222222]">
                <div className="flex items-center gap-2">
                  <span className="font-poster text-[18px] leading-none text-white uppercase">{label}</span>
                  {isCurrentMonth && (
                    <span className="font-tag text-[9px] bg-[#ffd400] text-[#0a0a0a] px-1.5 py-0.5 rounded-full font-bold uppercase">
                      Atual
                    </span>
                  )}
                </div>
                <span className="font-poster text-[18px] leading-none text-[#ffd400]">
                  {isVisible ? formatCurrency(total) : '••••'}
                </span>
              </div>

              {/* Events */}
              <div className="divide-y divide-[#2a2a2a]">
                {evs.map(ev => {
                  const cfg = STATUS_CONFIG[ev._statusKey] || STATUS_CONFIG.scheduled;
                  const dateStr = ev.start_date
                    ? format(parseISO(ev.start_date), "dd/MM", { locale: ptBR })
                    : '—';
                  return (
                    <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <EventHeading
                          event={ev}
                          client={resolveClientForEvent(ev, clientMap)}
                          size="sm"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#888888]">{dateStr}</span>
                          <span className={`text-[10px] ${cfg.color}`}>{cfg.label}</span>
                          {ev.location_city && (
                            <span className="text-[10px] text-[#666666] truncate">{ev.location_city}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-white flex-shrink-0">
                        {isVisible ? formatCurrency(ev._value) : '••••'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Month footer: total bar */}
              {total > 0 && kpis.d90 > 0 && (
                <div className="px-4 pb-2 pt-1">
                  <div className="h-1 bg-[#222222] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#ffd400]"
                      style={{ width: `${Math.min((total / kpis.d90) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-[10px] text-[#888888]">{cfg.label}</span>
          </div>
        ))}
      </div>
      </>)}
    </div>
  );
}
