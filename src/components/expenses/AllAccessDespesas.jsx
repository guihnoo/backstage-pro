import { useState, useMemo } from 'react';
import {
  format,
  parseISO,
  isSameMonth,
  subMonths,
  addMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Camera, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORY_COLORS = {
  transporte: '#ffd400',
  alimentacao: '#ff2e88',
  equipamento: '#00d2ff',
  hospedagem: '#a855f7',
  combustivel: '#ff9900',
  quilometragem: '#38bdf8',
  manutencao: '#10b981',
  outros: '#888888',
};

const CATEGORY_LABELS = {
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  equipamento: 'Equipamento',
  hospedagem: 'Hospedagem',
  combustivel: 'Combustível',
  quilometragem: 'Quilometragem',
  manutencao: 'Manutenção',
  outros: 'Outros',
};

export default function AllAccessDespesas({
  expenses = [],
  events = [],
  clients = [],
  formatCurrency,
  isVisible = true,
  onScanReceipt,
  onNewExpense,
  onEditExpense,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const eventMap = useMemo(() => {
    const map = new Map();
    for (const ev of events) map.set(ev.id, ev);
    return map;
  }, [events]);

  const clientMap = useMemo(() => {
    const map = new Map();
    for (const c of clients) map.set(c.id, c);
    return map;
  }, [clients]);

  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase();

  // Expenses in current month
  const monthExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const d = exp.expense_date || exp.date;
      if (!d) return false;
      return isSameMonth(parseISO(d), currentDate);
    });
  }, [expenses, currentDate]);

  const totalMonth = useMemo(() => {
    return monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  }, [monthExpenses]);

  // "PRA ONDE FOI" category distribution
  const categoryStats = useMemo(() => {
    const map = {};
    for (const exp of monthExpenses) {
      const cat = exp.category || 'outros';
      map[cat] = (map[cat] || 0) + (exp.amount || 0);
    }
    const total = totalMonth || 1;
    return Object.entries(map).map(([cat, val]) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] || cat,
      color: CATEGORY_COLORS[cat] || '#888888',
      value: val,
      pct: `${Math.round((val / total) * 100)}%`,
    })).sort((a, b) => b.value - a.value);
  }, [monthExpenses, totalMonth]);

  // Grouped by event
  const expensesByEvent = useMemo(() => {
    const groups = new Map();
    for (const exp of monthExpenses) {
      const evId = exp.event_id || 'sem-evento';
      if (!groups.has(evId)) groups.set(evId, []);
      groups.get(evId).push(exp);
    }
    return Array.from(groups.entries()).map(([evId, list]) => {
      const ev = eventMap.get(evId);
      const cl = ev ? clientMap.get(ev.client_id) : null;
      const total = list.reduce((s, e) => s + (e.amount || 0), 0);
      const reimbursable = list.filter((e) => e.is_reimbursable && !e.reimbursed).reduce((s, e) => s + (e.amount || 0), 0);
      return {
        event: ev,
        eventId: evId,
        title: ev?.title || 'Despesas Gerais',
        subtitle: cl ? cl.name : ev?.location || 'Sem evento vinculado',
        color: ev?.color || '#ffd400',
        total,
        reimbursable,
        items: list,
      };
    });
  }, [monthExpenses, eventMap, clientMap]);

  return (
    <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
      {/* Header matching Board C */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-1.5 font-tag text-[11px] tracking-[2px] text-[#a8a8a8]">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => setCurrentDate((d) => subMonths(d, 1))}
              className="-ml-2 w-9 h-9 flex items-center justify-center rounded-full text-[#a8a8a8] hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span aria-live="polite">{monthLabel}</span>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => setCurrentDate((d) => addMonths(d, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#a8a8a8] hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h1 className="font-poster text-[38px] sm:text-[40px] text-white leading-none tracking-wide uppercase mt-0.5">
            DESPESAS
          </h1>
        </div>

        <div className="text-right">
          <div className="font-poster text-[26px] text-white leading-none">
            {isVisible ? formatCurrency(totalMonth) : '•••••'}
          </div>
          <div className="font-tag text-[10px] text-[#a8a8a8] uppercase mt-0.5">
            NO MÊS
          </div>
        </div>
      </div>

      {/* 2 Big Action CTAs matching Board C */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <button
          type="button"
          onClick={onScanReceipt}
          className="h-16 rounded-2xl border-none bg-[#ffd400] text-[#0a0a0a] font-sans text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-[#ffe033] transition-transform active:scale-95 shadow-sm"
        >
          <Camera className="w-5 h-5 stroke-[2.2]" />
          Fotografar recibo
        </button>

        <button
          type="button"
          onClick={onNewExpense}
          aria-label="Nova despesa (digitar)"
          className="h-16 rounded-2xl border border-[#333333] bg-transparent text-white font-sans text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-[#161616] transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[2.2]" />
          Digitar
        </button>
      </div>

      {/* PRA ONDE FOI Card */}
      <div className="rounded-2xl bg-[#161616] border border-[#222222] p-3.5">
        <div className="font-tag text-[11px] tracking-wider text-[#a8a8a8] mb-2">
          PRA ONDE FOI
        </div>

        {categoryStats.length > 0 ? (
          <>
            <div className="flex h-3 rounded-md overflow-hidden gap-0.5 mb-2.5">
              {categoryStats.map((c, i) => (
                <div
                  key={i}
                  style={{ width: c.pct, background: c.color }}
                  title={`${c.label}: ${c.pct}`}
                  className="h-full transition-all"
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {categoryStats.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span
                    style={{ background: c.color }}
                    className="w-2 h-2 rounded-[2px] flex-shrink-0"
                  />
                  <span className="flex-1 text-[#c8c8c8] truncate">{c.label}</span>
                  <span className="font-tag text-white">
                    {isVisible ? formatCurrency(c.value) : '•••'}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-[#888888] font-tag">Sem gastos registrados neste mês.</p>
        )}
      </div>

      {/* POR EVENTO List */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">
          POR EVENTO
        </div>

        {expensesByEvent.length > 0 ? (
          <div className="space-y-4">
            {expensesByEvent.map((grp) => (
              <div key={grp.eventId} className="space-y-1.5">
                {/* Event header strip */}
                <div
                  style={{ borderTopColor: grp.color }}
                  className="flex items-center gap-2 pt-2 border-t-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-extrabold text-white truncate">
                      {grp.title}
                    </div>
                    <div className="text-[11px] text-[#a8a8a8] truncate mt-0.5">
                      {grp.subtitle}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-poster text-[18px] text-white">
                      {isVisible ? formatCurrency(grp.total) : '•••••'}
                    </div>
                    {grp.reimbursable > 0 && (
                      <div className="font-tag text-[9px] text-[#ff2e88] font-bold">
                        {isVisible ? formatCurrency(grp.reimbursable) : '••••'} A REEMBOLSAR
                      </div>
                    )}
                  </div>
                </div>

                {/* Expense items */}
                <div className="space-y-1">
                  {grp.items.map((exp) => {
                    const catColor = CATEGORY_COLORS[exp.category] || '#888888';
                    const expTitle = exp.title || exp.description || CATEGORY_LABELS[exp.category] || 'Despesa';
                    const expDate = exp.expense_date || exp.date;
                    return (
                      <button
                        type="button"
                        key={exp.id}
                        onClick={() => onEditExpense?.(exp)}
                        aria-label={`Editar despesa ${expTitle}`}
                        className="w-full text-left rounded-xl bg-[#161616] border border-[#222222] hover:border-[#333333] p-2 sm:px-3 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <div
                          style={{ background: catColor }}
                          className="w-7 h-7 rounded-lg text-[#0a0a0a] font-poster text-[11px] flex items-center justify-center flex-shrink-0 uppercase"
                        >
                          {(exp.category || 'O').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-white truncate">{expTitle}</div>
                          {expDate && (
                            <div className="font-tag text-[10px] text-[#888888] mt-0.5">
                              {format(parseISO(expDate), "dd/MM", { locale: ptBR })} · {CATEGORY_LABELS[exp.category] || 'Outros'}
                            </div>
                          )}
                        </div>
                        {exp.is_reimbursable && (
                          <span className="font-tag text-[9px] font-bold text-[#ff2e88] uppercase">
                            {exp.reimbursed ? 'REEMBOLSADO' : 'REEMBOLSÁVEL'}
                          </span>
                        )}
                        <span className="font-tag text-[13px] font-bold text-white min-w-[58px] text-right">
                          {isVisible ? formatCurrency(exp.amount) : '••••'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[#161616] border border-[#222222] p-8 text-center">
            <p className="font-bold text-white">Nenhuma despesa</p>
            <p className="text-xs text-[#888888] font-tag mt-1">Toque em “Fotografar recibo” ou “Digitar” para lançar um gasto.</p>
          </div>
        )}
      </div>
    </div>
  );
}
