import { useMemo, useState } from 'react';
import { FileText, TrendingUp, TrendingDown, Minus, Share2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import appToast from '@/lib/appToast';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const EXPENSE_LABELS = {
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  hospedagem: 'Hospedagem',
  equipamento: 'Equipamento',
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  outros: 'Outros',
};

export default function IRSummary({ events = [], expenses = [], work = [] }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [showMonths, setShowMonths] = useState(false);

  const workByEvent = useMemo(() => {
    const map = {};
    work.forEach(w => {
      if (!w.event_id) return;
      if (!map[w.event_id]) map[w.event_id] = [];
      map[w.event_id].push(w);
    });
    return map;
  }, [work]);

  const data = useMemo(() => {
    const yearStr = String(year);

    // Receita: eventos pagos no ano (pelo paid_date — competência de recebimento)
    const paidEvents = events.filter(ev => {
      if (ev.payment_status !== 'paid' || ev.status === 'cancelled') return false;
      const refDate = ev.paid_date || ev.start_date || '';
      return refDate.startsWith(yearStr);
    });

    const totalRevenue = paidEvents.reduce((s, ev) => {
      const wk = workByEvent[ev.id] || [];
      const fromWork = wk.reduce((a, w) => a + (w.daily_cache || 0), 0);
      return s + (fromWork > 0 ? fromWork : (Number(ev.paid_amount) || getEventCacheAmount(ev)));
    }, 0);

    // Despesas do ano
    const yearExpenses = expenses.filter(exp => {
      const d = exp.expense_date || exp.date || '';
      return d.startsWith(yearStr);
    });
    const totalExpenses = yearExpenses.reduce((s, e) => s + (e.amount || 0), 0);

    // Despesas por categoria
    const byCategory = {};
    yearExpenses.forEach(e => {
      const cat = e.category || 'outros';
      byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
    });

    // Por mês
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const prefix = `${yearStr}-${m}`;
      const rev = paidEvents
        .filter(ev => (ev.paid_date || ev.start_date || '').startsWith(prefix))
        .reduce((s, ev) => {
          const wk = workByEvent[ev.id] || [];
          const fromWork = wk.reduce((a, w) => a + (w.daily_cache || 0), 0);
          return s + (fromWork > 0 ? fromWork : (Number(ev.paid_amount) || getEventCacheAmount(ev)));
        }, 0);
      const exp = yearExpenses
        .filter(e => (e.expense_date || e.date || '').startsWith(prefix))
        .reduce((s, e) => s + (e.amount || 0), 0);
      return { label: MONTH_NAMES[i], rev, exp, profit: rev - exp };
    });

    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : null;
    const totalEvents = paidEvents.length;

    return { totalRevenue, totalExpenses, netProfit, margin, totalEvents, byCategory, months };
  }, [year, events, expenses, workByEvent]);

  const years = useMemo(() => {
    const set = new Set();
    events.forEach(ev => { if (ev.start_date) set.add(parseInt(ev.start_date.slice(0, 4))); });
    expenses.forEach(e => {
      const d = e.expense_date || e.date || '';
      if (d) set.add(parseInt(d.slice(0, 4)));
    });
    if (!set.size) set.add(currentYear);
    return [...set].sort((a, b) => b - a);
  }, [events, expenses, currentYear]);

  const handleShare = () => {
    const lines = [
      `📊 *RESUMO IR ${year}*`,
      `━━━━━━━━━━━━━━━━`,
      `💰 Receita bruta: ${formatCurrency(data.totalRevenue)}`,
      `💸 Despesas: ${formatCurrency(data.totalExpenses)}`,
      `✅ Lucro líquido: ${formatCurrency(data.netProfit)}`,
      data.margin !== null ? `📈 Margem: ${data.margin.toFixed(1)}%` : '',
      `🎭 Shows pagos: ${data.totalEvents}`,
      ``,
      `*Mês a mês:*`,
      ...data.months
        .filter(m => m.rev > 0 || m.exp > 0)
        .map(m => `${m.label}: Rec ${formatCurrency(m.rev)} / Desp ${formatCurrency(m.exp)}`),
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      navigator.share({ text: lines }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(lines).then(() =>
        appToast.success('Resumo copiado!', { description: 'Cole no WhatsApp ou contador.' })
      );
    }
  };

  return (
    <div className="space-y-4 mt-6 pt-6 border-t border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-semibold text-white">Resumo para IR</h3>
          <span className="text-xs text-slate-500">— base para declaração</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Year selector */}
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-xs bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
            aria-label="Ano do relatório"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhar</span>
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg text-xs text-slate-400">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-400" />
        <p>Baseado apenas nos dados cadastrados no app. Consulte seu contador para a declaração oficial.</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Receita bruta', value: data.totalRevenue, color: 'text-green-400', Icon: TrendingUp },
          { label: 'Despesas', value: data.totalExpenses, color: 'text-red-400', Icon: TrendingDown },
          { label: 'Lucro líquido', value: data.netProfit, color: data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400', Icon: Minus },
          { label: 'Shows pagos', value: data.totalEvents, color: 'text-blue-400', isCount: true, Icon: FileText },
        ].map(({ label, value, color, isCount, Icon }) => (
          <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[11px] text-slate-400">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>
              {isCount ? value : (isVisible ? formatCurrency(value) : '••••')}
            </p>
            {!isCount && data.margin !== null && label === 'Lucro líquido' && (
              <p className="text-[10px] text-slate-500 mt-0.5">margem {data.margin.toFixed(1)}%</p>
            )}
          </div>
        ))}
      </div>

      {/* Despesas por categoria */}
      {Object.keys(data.byCategory).length > 0 && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-300 mb-3">Despesas por categoria</p>
          <div className="space-y-2">
            {Object.entries(data.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total]) => (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{EXPENSE_LABELS[cat] || cat}</span>
                  <span className="font-medium text-white">{isVisible ? formatCurrency(total) : '••••'}</span>
                </div>
              ))}
            <div className="flex items-center justify-between text-xs border-t border-slate-700 pt-2 mt-2">
              <span className="text-slate-300 font-semibold">Total</span>
              <span className="font-bold text-red-400">{isVisible ? formatCurrency(data.totalExpenses) : '••••'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mês a mês — colapsável */}
      <button
        type="button"
        onClick={() => setShowMonths(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/30 border border-slate-700 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
      >
        <span className="font-medium">Detalhamento mês a mês</span>
        {showMonths ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showMonths && (
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 gap-0 text-[10px] text-slate-500 font-semibold uppercase tracking-wide px-4 py-2 border-b border-slate-700">
            <span>Mês</span>
            <span className="text-right">Receita</span>
            <span className="text-right">Despesas</span>
            <span className="text-right">Lucro</span>
          </div>
          {data.months.map((m, i) => {
            const hasData = m.rev > 0 || m.exp > 0;
            return (
              <div
                key={i}
                className={`grid grid-cols-4 gap-0 px-4 py-2 text-xs border-b border-slate-700/30 last:border-0 ${!hasData ? 'opacity-30' : ''}`}
              >
                <span className="text-slate-400">{m.label}</span>
                <span className={`text-right font-medium ${m.rev > 0 ? 'text-green-400' : 'text-slate-600'}`}>
                  {m.rev > 0 ? (isVisible ? formatCurrency(m.rev) : '••••') : '—'}
                </span>
                <span className={`text-right font-medium ${m.exp > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                  {m.exp > 0 ? (isVisible ? formatCurrency(m.exp) : '••••') : '—'}
                </span>
                <span className={`text-right font-bold ${m.profit > 0 ? 'text-emerald-400' : m.profit < 0 ? 'text-red-400' : 'text-slate-600'}`}>
                  {hasData ? (isVisible ? formatCurrency(m.profit) : '••••') : '—'}
                </span>
              </div>
            );
          })}
          {/* Totals row */}
          <div className="grid grid-cols-4 gap-0 px-4 py-2.5 bg-slate-800/60 text-xs font-bold border-t border-slate-700">
            <span className="text-slate-300">Total</span>
            <span className="text-right text-green-400">{isVisible ? formatCurrency(data.totalRevenue) : '••••'}</span>
            <span className="text-right text-red-400">{isVisible ? formatCurrency(data.totalExpenses) : '••••'}</span>
            <span className={`text-right ${data.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {isVisible ? formatCurrency(data.netProfit) : '••••'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
