import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

const COLUMNS = [
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
    color: 'text-indigo-300',
    border: 'border-indigo-500/30',
    header: 'bg-indigo-500/10',
    dot: '#818cf8',
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

const KanbanCard = ({ ev, client, onOpen, formatCurrency, isVisible }) => {
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
            {amount > 0 && (
              <span className="text-xs font-semibold text-slate-300 ml-auto">
                {isVisible ? formatCurrency(amount) : '••••'}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

const KanbanPipeline = ({ events = [], clients = [], onEventClick }) => {
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const clientMap = useMemo(
    () => new Map((clients || []).map((c) => [c.id, c])),
    [clients]
  );

  const activeEvents = useMemo(
    () => events.filter((e) => e.status !== 'cancelled'),
    [events]
  );

  const columns = useMemo(() =>
    COLUMNS.map((col) => ({
      ...col,
      events: activeEvents.filter(col.match),
      total: activeEvents.filter(col.match).reduce(
        (s, e) => s + getEventCacheAmount(e),
        0
      ),
    })),
    [activeEvents]
  );

  const summary = useMemo(() => {
    const toReceive = activeEvents
      .filter(e => e.status === 'completed' && e.payment_status !== 'paid')
      .reduce((s, e) => s + getEventCacheAmount(e), 0);
    const paid = activeEvents
      .filter(e => e.payment_status === 'paid')
      .reduce((s, e) => s + getEventCacheAmount(e), 0);
    return { toReceive, paid, total: activeEvents.length };
  }, [activeEvents]);

  if (activeEvents.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        Nenhum evento para exibir no pipeline.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pipeline summary bar */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-1.5 text-slate-400">
          <span className="font-bold text-slate-200">{summary.total}</span> shows no pipeline
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
          >
            {/* Column header */}
            <div className={`${col.header} px-3 py-2.5 flex items-center justify-between gap-2`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                {col.label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${col.color}`}>{col.events.length}</span>
              </div>
            </div>

            {/* Total */}
            {col.total > 0 && (
              <div className={`px-3 py-1.5 border-b ${col.border} bg-slate-900/30`}>
                <p className="text-[10px] text-slate-500">
                  Total:{' '}
                  <span className={`font-semibold ${col.color}`}>
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
