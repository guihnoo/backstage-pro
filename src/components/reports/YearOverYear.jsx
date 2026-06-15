import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, CalendarDays } from 'lucide-react';
import { getYear, getMonth, getDate, parseISO } from 'date-fns';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

function parseEventDate(event) {
  try { return parseISO(event.start_date); } catch { return null; }
}

function calcMetrics(events, clients, yearFilter, monthFilter, dayFilter) {
  const evts = events.filter(e => {
    const d = parseEventDate(e);
    if (!d) return false;
    if (getYear(d) !== yearFilter) return false;
    if (monthFilter !== null && getMonth(d) > monthFilter) return false;
    if (monthFilter !== null && getMonth(d) === monthFilter && getDate(d) > dayFilter) return false;
    return e.status !== 'cancelled';
  });

  const paid = evts.filter(e => e.payment_status === 'paid');
  const revenue = paid.reduce((s, e) => s + Number(e.paid_amount || 0), 0);
  const avgTicket = paid.length > 0 ? revenue / paid.length : 0;

  const clientIds = new Set(evts.map(e => e.client_id).filter(Boolean));

  return {
    shows: evts.length,
    revenue,
    avgTicket,
    activeClients: clientIds.size,
  };
}

function Delta({ value }) {
  if (value === null || !isFinite(value)) return <span className="text-slate-500 text-xs">—</span>;
  const up = value > 0;
  const zero = value === 0;
  if (zero) return (
    <span className="flex items-center gap-0.5 text-slate-400 text-xs">
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{value.toFixed(0)}%
    </span>
  );
}

function delta(curr, prev) {
  if (!prev || prev === 0) return curr > 0 ? 100 : null;
  return ((curr - prev) / prev) * 100;
}

const YearOverYear = ({ events = [], clients = [] }) => {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { primaryHex } = useCategoryTheme();

  const now = new Date();
  const currYear = getYear(now);
  const prevYear = currYear - 1;
  const curMonth = getMonth(now);
  const curDay = getDate(now);

  const hasData = useMemo(() => {
    return events.some(e => {
      const d = parseEventDate(e);
      return d && getYear(d) === prevYear;
    });
  }, [events, prevYear]);

  const curr = useMemo(
    () => calcMetrics(events, clients, currYear, curMonth, curDay),
    [events, clients, currYear, curMonth, curDay]
  );

  const prev = useMemo(
    () => calcMetrics(events, clients, prevYear, curMonth, curDay),
    [events, clients, prevYear, curMonth, curDay]
  );

  if (!hasData) return null;

  const rows = [
    {
      label: 'Shows realizados',
      curr: curr.shows,
      prev: prev.shows,
      fmt: v => String(v),
      delta: delta(curr.shows, prev.shows),
    },
    {
      label: 'Receita recebida',
      curr: curr.revenue,
      prev: prev.revenue,
      fmt: v => isVisible ? formatCurrency(v) : '••••',
      delta: delta(curr.revenue, prev.revenue),
    },
    {
      label: 'Ticket médio',
      curr: curr.avgTicket,
      prev: prev.avgTicket,
      fmt: v => isVisible ? formatCurrency(v) : '••••',
      delta: delta(curr.avgTicket, prev.avgTicket),
    },
    {
      label: 'Clientes ativos',
      curr: curr.activeClients,
      prev: prev.activeClients,
      fmt: v => String(v),
      delta: delta(curr.activeClients, prev.activeClients),
    },
  ];

  const overallDelta = delta(curr.revenue, prev.revenue);
  const overallUp = overallDelta !== null && overallDelta > 0;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 bp-text-primary" style={{ color: primaryHex }} />
        <h3 className="text-sm font-semibold text-slate-200">Comparação Ano a Ano</h3>
        <span className="ml-auto text-xs text-slate-500">jan–hoje</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 pr-4 text-xs text-slate-400 font-normal">Métrica</th>
              <th className="text-right py-2 px-3 text-xs font-semibold bp-text-primary" style={{ color: primaryHex }}>{currYear}</th>
              <th className="text-right py-2 px-3 text-xs text-slate-400 font-normal">{prevYear}</th>
              <th className="text-right py-2 pl-3 text-xs text-slate-400 font-normal">Var.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.map(row => (
              <tr key={row.label} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 pr-4 text-slate-300">{row.label}</td>
                <td className="py-2.5 px-3 text-right font-medium text-white tabular-nums">{row.fmt(row.curr)}</td>
                <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">{row.fmt(row.prev)}</td>
                <td className="py-2.5 pl-3 text-right">
                  <Delta value={row.delta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {overallDelta !== null && (
        <p className={`mt-3 text-xs text-center ${overallUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {overallUp
            ? `Receita ${overallDelta.toFixed(0)}% maior que no mesmo período de ${prevYear} 🚀`
            : `Receita ${Math.abs(overallDelta).toFixed(0)}% menor que no mesmo período de ${prevYear}`}
        </p>
      )}
    </div>
  );
};

export default YearOverYear;
