import { useMemo, useState } from 'react';
import { format, parseISO, subMonths, startOfYear, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const STATIC_COLUMNS = [
  {
    key: 'negotiating',
    label: 'Negociando',
    color: 'text-slate-300',
    border: 'border-slate-600/40',
    header: 'bg-slate-700/40',
    dot: '#94a3b8',
    match: (ev) => ev.status === 'pending' && ev.payment_status !== 'paid',
  },
  {
    key: 'confirmed',
    label: 'Confirmado',
    themed: true,
    match: (ev) =>
      (ev.status === 'scheduled' || ev.status === 'confirmed') &&
      ev.payment_status !== 'paid',
  },
  {
    key: 'to_receive',
    label: 'A Receber',
    color: 'text-amber-300',
    border: 'border-amber-500/30',
    header: 'bg-amber-500/10',
    dot: '#fbbf24',
    match: (ev) => ev.status === 'completed' && ev.payment_status !== 'paid',
  },
  {
    key: 'paid',
    label: 'Pago',
    color: 'text-emerald-300',
    border: 'border-emerald-500/30',
    header: 'bg-emerald-500/10',
    dot: '#34d399',
    match: (ev) => ev.payment_status === 'paid',
  },
];

const PERIODS = [
  { key: 'upcoming', label: 'Futuros' },
  { key: '3m', label: '3 meses' },
  { key: 'year', label: 'Este ano' },
  { key: 'all', label: 'Todos' },
];

const UrgencyBadge = ({ ev }) => {
  const endDate = ev.payment_due_date || ev.end_date || ev.start_date;
  if (!endDate) return null;
  const days = differenceInDays(new Date(), parseISO(endDate));
  if (days < 1) return null;

  let cls, label;
  if (days >= 30) {
    cls = 'bg-red-500/20 border-red-500/40 text-red-300';
    label = `${days}d vencido`;
  } else if (days >= 14) {
    cls = 'bg-amber-500/20 border-amber-500/40 text-amber-300';
    label = `${days}d atraso`;
  } else {
    cls = 'bg-slate-700/60 border-slate-600/40 text-slate-400';
    label = `${days}d atrás`;
  }

  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  );
};

const KanbanCard = ({ ev, client, onOpen, formatCurrency, isVisible, showUrgency }) => {
  const amount = getEventCacheAmount(ev);
  const dateStr = ev.start_date
    ? format(parseISO(ev.start_date), "d 'de' MMM", { locale: ptBR })
    : null;
  const evColor = ev.color || '#6366f1';

  return (
    <button
      type="button"
      onClick={() => onOpen(ev)}
      className="w-full text-left bg-slate-800/70 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg p-3 transition-all group"
    >
      <div className="flex items-start gap-2">
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: evColor }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate leading-snug">
            {ev.title || 'Sem título'}
          </p>
          {client && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{client.name}</p>
          )}
          <div className="flex items-center justify-between gap-2 mt-2">
            {dateStr && (
              <span className="text-[10px] text-slate-500 capitalize">{dateStr}</span>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              {showUrgency && <UrgencyBadge ev={ev} />}
              {amount > 0 && (
                <span className="text-xs font-semibold text-slate-300">
                  {isVisible ? formatCurrency(amount) : '••••'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

const KanbanPipeline = ({ events = [], clients = [], onEventClick }) => {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { primaryHex } = useCategoryTheme();
  const [period, setPeriod] = useState('3m');

  const columnsDef = useMemo(() => {
    return STATIC_COLUMNS.map((col) => {
      if (!col.themed) return col;
      return {
        ...col,
        color: 'bp-text-primary',
        border: 'border',
        header: '',
        dot: primaryHex,
        headerStyle: { background: `${primaryHex}1a` },
        borderStyle: { borderColor: `${primaryHex}4d` },
        textStyle: { color: primaryHex },
      };
    });
  }, [primaryHex]);

  const clientMap = useMemo(
    () => new Map((clients || []).map((c) => [c.id, c])),
    [clients]
  );

  const activeEvents = useMemo(
    () => events.filter((e) => e.status !== 'cancelled'),
    [events]
  );

  // Filter by period; unpaid completed events always show (need action)
  const filteredEvents = useMemo(() => {
    if (period === 'all') return activeEvents;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isUnpaid = (e) => e.status === 'completed' && e.payment_status !== 'paid';

    if (period === 'upcoming') {
      return activeEvents.filter(
        (e) => isUnpaid(e) || (e.start_date && parseISO(e.start_date) >= today)
      );
    }

    let cutoff;
    if (period === '3m') cutoff = subMonths(today, 3);
    if (period === 'year') cutoff = startOfYear(today);

    return activeEvents.filter(
      (e) => isUnpaid(e) || !e.start_date || parseISO(e.start_date) >= cutoff
    );
  }, [activeEvents, period]);

  const columns = useMemo(() => {
    const now = new Date();
    return columnsDef.map((col) => {
      let evs = filteredEvents.filter(col.match);
      // Sort "A Receber" by most days overdue first
      if (col.key === 'to_receive') {
        evs = [...evs].sort((a, b) => {
          const da = differenceInDays(now, parseISO(a.payment_due_date || a.end_date || a.start_date || '2000-01-01'));
          const db = differenceInDays(now, parseISO(b.payment_due_date || b.end_date || b.start_date || '2000-01-01'));
          return db - da;
        });
      }
      return {
        ...col,
        events: evs,
        total: evs.reduce((s, e) => s + getEventCacheAmount(e), 0),
      };
    });
  }, [filteredEvents, columnsDef]);

  const summary = useMemo(() => {
    const toReceive = filteredEvents
      .filter(e => e.status === 'completed' && e.payment_status !== 'paid')
      .reduce((s, e) => s + getEventCacheAmount(e), 0);
    const paid = filteredEvents
      .filter(e => e.payment_status === 'paid')
      .reduce((s, e) => s + getEventCacheAmount(e), 0);
    return { toReceive, paid, total: filteredEvents.length };
  }, [filteredEvents]);

  if (activeEvents.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        Nenhum evento para exibir no pipeline.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Period filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              period === p.key
                ? 'bp-view-active'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Pipeline summary bar */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-slate-400">
          <span className="font-bold text-slate-200">{summary.total}</span> shows
        </span>
        {summary.toReceive > 0 && (
          <span className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5 text-amber-300">
            A receber: <span className="font-bold">{isVisible ? formatCurrency(summary.toReceive) : '••••'}</span>
          </span>
        )}
        {summary.paid > 0 && (
          <span className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-emerald-300">
            Pago: <span className="font-bold">{isVisible ? formatCurrency(summary.paid) : '••••'}</span>
          </span>
        )}
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[720px]">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`flex-1 min-w-[170px] rounded-xl border ${col.border} flex flex-col overflow-hidden`}
              style={col.borderStyle}
            >
              {/* Column header */}
              <div
                className={`${col.header} px-3 py-2.5 flex items-center justify-between gap-2`}
                style={col.headerStyle}
              >
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}
                  style={col.textStyle}
                >
                  {col.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold ${col.color}`}
                    style={col.textStyle}
                  >
                    {col.events.length}
                  </span>
                </div>
              </div>

              {/* Total */}
              {col.total > 0 && (
                <div
                  className={`px-3 py-1.5 border-b ${col.border} bg-slate-900/30`}
                  style={col.borderStyle}
                >
                  <p className="text-[10px] text-slate-500">
                    Total:{' '}
                    <span
                      className={`font-semibold ${col.color}`}
                      style={col.textStyle}
                    >
                      {isVisible ? formatCurrency(col.total) : '••••'}
                    </span>
                  </p>
                </div>
              )}

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                {col.events.length === 0 ? (
                  <p className="text-[11px] text-slate-600 text-center py-6">vazio</p>
                ) : (
                  col.events.map((ev) => (
                    <KanbanCard
                      key={ev.id}
                      ev={ev}
                      client={clientMap.get(ev.client_id)}
                      onOpen={onEventClick}
                      formatCurrency={formatCurrency}
                      isVisible={isVisible}
                      showUrgency={col.key === 'to_receive'}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanPipeline;
