import { useMemo, useState } from 'react';
import { FileText, TrendingUp, TrendingDown, Minus, Share2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  buildWorkByEvent,
  monthKeyRange,
  paidEventsInPeriod,
  receivedInPeriod,
  sumReceived,
  yearRange,
} from '@/lib/financeMetrics';
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

  const workByEvent = useMemo(() => buildWorkByEvent(work), [work]);

  const data = useMemo(() => {
    const yearStr = String(year);

    // Receita: eventos pagos no ano (pelo paid_date — competência de recebimento)
    const paidEvents = paidEventsInPeriod(events, yearRange(year));

    const totalRevenue = sumReceived(paidEvents, workByEvent);

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
      const rev = receivedInPeriod(paidEvents, monthKeyRange(prefix), workByEvent);
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
    <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-3">
      {/* Header (All Access) */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8]">PARA O CONTADOR</div>
          <h3 className="font-poster text-[24px] leading-none text-white mt-1">IMPOSTO DE RENDA</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Year selector */}
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="h-9 text-base bg-[#0a0a0a] border border-[#333333] text-white rounded-full px-3 focus:outline-none focus:border-[#ffd400]"
            aria-label="Ano do relatório"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Compartilhar resumo do IR"
            className="h-9 w-9 flex items-center justify-center rounded-full bg-[#ffd400] text-[#0a0a0a] active:scale-95 transition-transform"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-[#a8a8a8]">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#ffd400]" />
        <p>Baseado apenas nos dados cadastrados no app. Consulte seu contador para a declaração oficial.</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        {[
          { label: 'Receita bruta', value: data.totalRevenue, color: 'text-[#ffd400]', Icon: TrendingUp },
          { label: 'Despesas', value: data.totalExpenses, color: 'text-[#ff2e88]', Icon: TrendingDown },
          { label: 'Lucro líquido', value: data.netProfit, color: data.netProfit >= 0 ? 'text-[#ffd400]' : 'text-[#ff2e88]', Icon: Minus },
          { label: 'Shows pagos', value: data.totalEvents, color: 'text-[#ffd400]', isCount: true, Icon: FileText },
        ].map(({ label, value, color, isCount, Icon }) => (
          <div key={label} className="bg-[#0a0a0a] border border-[#222222] rounded-[10px] p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-[#666666]" />
              <p className="font-tag text-[10px] uppercase text-[#a8a8a8]">{label}</p>
            </div>
            <p className={`font-poster text-[20px] leading-none truncate ${color}`}>
              {isCount ? value : (isVisible ? formatCurrency(value) : '••••')}
            </p>
            {!isCount && data.margin !== null && label === 'Lucro líquido' && (
              <p className="text-[10px] text-[#888888] mt-0.5">margem {data.margin.toFixed(1)}%</p>
            )}
          </div>
        ))}
      </div>

      {/* Despesas por categoria */}
      {Object.keys(data.byCategory).length > 0 && (
        <div className="bg-[#0a0a0a] border border-[#222222] rounded-[12px] p-3">
          <p className="font-tag text-[10px] tracking-[2px] text-[#a8a8a8] mb-2">DESPESAS POR CATEGORIA</p>
          <div className="space-y-2">
            {Object.entries(data.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total]) => (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="text-[#a8a8a8]">{EXPENSE_LABELS[cat] || cat}</span>
                  <span className="font-medium text-white">{isVisible ? formatCurrency(total) : '••••'}</span>
                </div>
              ))}
            <div className="flex items-center justify-between text-xs border-t border-[#2a2a2a] pt-2 mt-2">
              <span className="text-[#c8c8c8] font-semibold">Total</span>
              <span className="font-bold text-[#ff2e88]">{isVisible ? formatCurrency(data.totalExpenses) : '••••'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mês a mês — colapsável */}
      <button
        type="button"
        onClick={() => setShowMonths(v => !v)}
        className="w-full h-10 flex items-center justify-between px-4 bg-[#0a0a0a] border border-[#333333] rounded-full text-xs font-extrabold text-white transition-colors"
      >
        <span className="font-medium">Detalhamento mês a mês</span>
        {showMonths ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showMonths && (
        <div className="bg-[#0a0a0a] border border-[#222222] rounded-[12px] overflow-hidden">
          <div className="grid grid-cols-4 gap-0 text-[10px] text-[#888888] font-semibold uppercase tracking-wide px-4 py-2 border-b border-[#2a2a2a]">
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
                className={`grid grid-cols-4 gap-0 px-4 py-2 text-xs border-b border-[#2a2a2a] last:border-0 ${!hasData ? 'opacity-30' : ''}`}
              >
                <span className="text-[#a8a8a8]">{m.label}</span>
                <span className={`text-right font-medium ${m.rev > 0 ? 'text-[#ffd400]' : 'text-[#666666]'}`}>
                  {m.rev > 0 ? (isVisible ? formatCurrency(m.rev) : '••••') : '—'}
                </span>
                <span className={`text-right font-medium ${m.exp > 0 ? 'text-[#ff2e88]' : 'text-[#666666]'}`}>
                  {m.exp > 0 ? (isVisible ? formatCurrency(m.exp) : '••••') : '—'}
                </span>
                <span className={`text-right font-bold ${m.profit > 0 ? 'text-[#ffd400]' : m.profit < 0 ? 'text-[#ff2e88]' : 'text-[#666666]'}`}>
                  {hasData ? (isVisible ? formatCurrency(m.profit) : '••••') : '—'}
                </span>
              </div>
            );
          })}
          {/* Totals row */}
          <div className="grid grid-cols-4 gap-0 px-4 py-2.5 bg-[#1f1f1f] text-xs font-bold border-t border-[#2a2a2a]">
            <span className="text-[#c8c8c8]">Total</span>
            <span className="text-right text-[#ffd400]">{isVisible ? formatCurrency(data.totalRevenue) : '••••'}</span>
            <span className="text-right text-[#ff2e88]">{isVisible ? formatCurrency(data.totalExpenses) : '••••'}</span>
            <span className={`text-right ${data.netProfit >= 0 ? 'text-[#ffd400]' : 'text-[#ff2e88]'}`}>
              {isVisible ? formatCurrency(data.netProfit) : '••••'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
