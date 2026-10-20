import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  parseISO,
  isSameMonth,
  differenceInCalendarDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileDown, CheckCircle2, MessageCircle } from 'lucide-react';
import { getEventCacheAmount, isPaymentOverdue, daysOverduePayment } from '@/lib/eventFinance';
import { openWhatsAppCharge } from '@/lib/whatsapp';

export default function AllAccessDinheiro({
  events = [],
  clients = [],
  expenses = [],
  formatCurrency,
  isVisible = true,
  onExportPdf,
  onMarkPaid,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState('mes'); // 'mes', 'receber', 'fiscal', 'analise'

  const clientMap = useMemo(() => {
    const map = new Map();
    for (const c of clients) map.set(c.id, c);
    return map;
  }, [clients]);

  // Month navigation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR }).toUpperCase();

  // Events in this month
  const monthEvents = useMemo(() => {
    return events.filter((ev) => {
      if (ev.status === 'cancelled') return false;
      const d = ev.start_date || ev.date;
      if (!d) return false;
      const parsed = parseISO(d);
      return isSameMonth(parsed, currentDate);
    });
  }, [events, currentDate]);

  // Previous month events for comparison
  const prevMonthDate = subMonths(currentDate, 1);
  const prevMonthEvents = useMemo(() => {
    return events.filter((ev) => {
      if (ev.status === 'cancelled') return false;
      const d = ev.start_date || ev.date;
      if (!d) return false;
      const parsed = parseISO(d);
      return isSameMonth(parsed, prevMonthDate);
    });
  }, [events, prevMonthDate]);

  // Month expenses
  const monthExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const d = exp.expense_date || exp.date;
      if (!d) return false;
      return isSameMonth(parseISO(d), currentDate);
    });
  }, [expenses, currentDate]);

  const prevMonthExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const d = exp.expense_date || exp.date;
      if (!d) return false;
      return isSameMonth(parseISO(d), prevMonthDate);
    });
  }, [expenses, prevMonthDate]);

  // Totals
  const totalReceived = useMemo(() => {
    return monthEvents
      .filter((ev) => ev.payment_status === 'paid')
      .reduce((sum, ev) => sum + (ev.paid_amount || getEventCacheAmount(ev) || 0), 0);
  }, [monthEvents]);

  const totalPending = useMemo(() => {
    return monthEvents
      .filter((ev) => ev.payment_status !== 'paid')
      .reduce((sum, ev) => sum + (getEventCacheAmount(ev) || 0), 0);
  }, [monthEvents]);

  const totalExpense = useMemo(() => {
    return monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [monthExpenses]);

  const netPocket = totalReceived - totalExpense;

  // Previous net for comparison
  const prevNet = useMemo(() => {
    const r = prevMonthEvents
      .filter((ev) => ev.payment_status === 'paid')
      .reduce((sum, ev) => sum + (ev.paid_amount || getEventCacheAmount(ev) || 0), 0);
    const exp = prevMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return r - exp;
  }, [prevMonthEvents, prevMonthExpenses]);

  const netComparisonText = useMemo(() => {
    if (prevNet <= 0) return 'recebido menos suas despesas do mês';
    const pct = Math.round(((netPocket - prevNet) / prevNet) * 100);
    const prevMonthName = format(prevMonthDate, 'MMMM', { locale: ptBR });
    if (pct > 0) return `recebido menos suas despesas · ${pct}% a mais que ${prevMonthName}`;
    if (pct < 0) return `recebido menos suas despesas · ${Math.abs(pct)}% a menos que ${prevMonthName}`;
    return `mesmo rendimento de ${prevMonthName}`;
  }, [netPocket, prevNet, prevMonthDate]);

  // Weekly breakdown
  const weeksData = useMemo(() => {
    const weeks = [
      { label: 'Sem 1', got: 0, due: 0 },
      { label: 'Sem 2', got: 0, due: 0 },
      { label: 'Sem 3', got: 0, due: 0 },
      { label: 'Sem 4', got: 0, due: 0 },
      { label: 'Sem 5', got: 0, due: 0 },
    ];
    for (const ev of monthEvents) {
      const d = ev.start_date ? parseISO(ev.start_date) : null;
      if (!d) continue;
      const dayOfMonth = d.getDate();
      const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 4);
      const val = getEventCacheAmount(ev) || 0;
      if (ev.payment_status === 'paid') {
        weeks[weekIndex].got += val;
      } else {
        weeks[weekIndex].due += val;
      }
    }
    const maxVal = Math.max(1, ...weeks.map((w) => w.got + w.due));
    return weeks.map((w) => ({
      ...w,
      gotHeight: `${Math.round((w.got / maxVal) * 80)}%`,
      dueHeight: `${Math.round((w.due / maxVal) * 80)}%`,
    }));
  }, [monthEvents]);

  // Top clients ranking
  const topClients = useMemo(() => {
    const map = {};
    for (const ev of monthEvents) {
      const val = getEventCacheAmount(ev) || 0;
      const cl = clientMap.get(ev.client_id);
      const name = cl?.name || ev.client_name || 'Outro';
      map[name] = (map[name] || 0) + val;
    }
    const arr = Object.entries(map).map(([name, value]) => ({ name, value }));
    arr.sort((a, b) => b.value - a.value);
    const top = arr.slice(0, 3);
    const max = top[0]?.value || 1;
    return top.map((t) => ({
      ...t,
      pct: `${Math.round((t.value / max) * 100)}%`,
    }));
  }, [monthEvents, clientMap]);

  // All pending receivable events across all time
  const allPendingReceivables = useMemo(() => {
    return events
      .filter((ev) => ev.status !== 'cancelled' && ev.payment_status !== 'paid')
      .sort((a, b) => (a.start_date > b.start_date ? 1 : -1));
  }, [events]);

  const totalAllPending = useMemo(() => {
    return allPendingReceivables.reduce((s, ev) => s + (getEventCacheAmount(ev) || 0), 0);
  }, [allPendingReceivables]);

  // Annual MEI faturamento
  const annualTotal = useMemo(() => {
    const year = currentDate.getFullYear();
    return events
      .filter((ev) => {
        if (ev.status === 'cancelled') return false;
        const d = ev.start_date || ev.date;
        return d && parseISO(d).getFullYear() === year && ev.payment_status === 'paid';
      })
      .reduce((s, ev) => s + (ev.paid_amount || getEventCacheAmount(ev) || 0), 0);
  }, [events, currentDate]);

  const meiLimit = 81000;
  const meiPct = Math.min(100, Math.round((annualTotal / meiLimit) * 100));

  return (
    <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-[2px] text-[#a8a8a8]">
            <button
              type="button"
              onClick={() => setCurrentDate((d) => subMonths(d, 1))}
              className="p-1 text-[#a8a8a8] hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>{monthLabel}</span>
            <button
              type="button"
              onClick={() => setCurrentDate((d) => addMonths(d, 1))}
              className="p-1 text-[#a8a8a8] hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <h1 className="font-display text-[38px] sm:text-[40px] text-white leading-none tracking-wide uppercase">
            DINHEIRO
          </h1>
        </div>

        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            className="h-10 px-3.5 rounded-full border border-[#333333] bg-transparent text-white font-sans text-[13px] font-extrabold hover:bg-[#1a1a1a] transition-all active:scale-95 flex items-center gap-1.5"
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </button>
        )}
      </div>

      {/* 4 Tabs matching Board C */}
      <div
        role="tablist"
        className="grid grid-cols-4 gap-1 bg-[#161616] border border-[#262626] rounded-2xl p-1 shadow-sm"
      >
        {[
          { key: 'mes', label: 'Mês' },
          { key: 'receber', label: 'A receber' },
          { key: 'fiscal', label: 'Fiscal' },
          { key: 'analise', label: 'Análise' },
        ].map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={`h-9 rounded-xl font-sans text-xs font-extrabold transition-all border-0 ${
              activeTab === t.key
                ? 'bg-[#ffd400] text-[#0a0a0a] shadow-sm'
                : 'bg-transparent text-[#a8a8a8] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MÊS */}
      {activeTab === 'mes' && (
        <section className="flex flex-col gap-2.5">
          {/* Hero Yellow Card: SOBROU NO BOLSO */}
          <div className="rounded-2xl bg-[#ffd400] text-[#0a0a0a] p-4 shadow-md">
            <div className="font-mono text-[11px] font-bold tracking-wider">
              SOBROU NO BOLSO
            </div>
            <div className="font-display text-[44px] sm:text-[48px] leading-tight my-0.5">
              {isVisible ? formatCurrency(netPocket) : '••••••••'}
            </div>
            <div className="text-[13px] font-bold opacity-90">
              {netComparisonText}
            </div>
          </div>

          {/* 3 Metrics Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-xl bg-[#161616] border border-[#222222] p-2.5">
              <div className="font-mono text-[10px] text-[#a8a8a8] uppercase truncate">
                RECEBIDO
              </div>
              <div className="font-display text-[20px] text-white leading-none mt-1 truncate">
                {isVisible ? formatCurrency(totalReceived) : '•••••'}
              </div>
            </div>

            <div className="rounded-xl bg-[#161616] border border-[#222222] p-2.5">
              <div className="font-mono text-[10px] text-[#a8a8a8] uppercase truncate">
                A RECEBER
              </div>
              <div className="font-display text-[20px] text-[#ff2e88] leading-none mt-1 truncate">
                {isVisible ? formatCurrency(totalPending) : '•••••'}
              </div>
            </div>

            <div className="rounded-xl bg-[#161616] border border-[#222222] p-2.5">
              <div className="font-mono text-[10px] text-[#a8a8a8] uppercase truncate">
                DESPESAS
              </div>
              <div className="font-display text-[20px] text-white leading-none mt-1 truncate">
                {isVisible ? formatCurrency(totalExpense) : '•••••'}
              </div>
            </div>
          </div>

          {/* Semana a Semana Dual-Bar Chart */}
          <div className="rounded-2xl bg-[#161616] border border-[#222222] p-3.5">
            <div className="font-mono text-[11px] tracking-wider text-[#a8a8a8] mb-3">
              SEMANA A SEMANA
            </div>
            <div className="h-28 grid grid-cols-5 gap-3 items-end px-1">
              {weeksData.map((w, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex flex-col justify-end gap-0.5 h-20">
                    {w.due > 0 && (
                      <div
                        style={{ height: w.dueHeight }}
                        className="w-full bg-[#ff2e88] rounded-t-[3px] transition-all"
                        title={`A receber: ${formatCurrency(w.due)}`}
                      />
                    )}
                    {w.got > 0 && (
                      <div
                        style={{ height: w.gotHeight }}
                        className="w-full bg-[#ffd400] rounded-t-[3px] transition-all"
                        title={`Recebido: ${formatCurrency(w.got)}`}
                      />
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-[#a8a8a8]">{w.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#222222] font-mono text-[10px] text-[#a8a8a8]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ffd400]" />
                recebido
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ff2e88]" />
                a receber
              </span>
            </div>
          </div>

          {/* Quem Mais Te Pagou */}
          <div className="rounded-2xl bg-[#161616] border border-[#222222] p-3.5">
            <div className="font-mono text-[11px] tracking-wider text-[#a8a8a8] mb-2">
              QUEM MAIS TE PAGOU
            </div>
            {topClients.length > 0 ? (
              <div className="space-y-2.5">
                {topClients.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex-1 text-[14px] font-bold text-white truncate">
                      {c.name}
                    </span>
                    <div className="w-24 h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden">
                      <div style={{ width: c.pct }} className="h-full bg-[#ffd400]" />
                    </div>
                    <span className="font-mono text-[12px] text-white w-20 text-right truncate">
                      {isVisible ? formatCurrency(c.value) : '•••••'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#888888] font-mono">Sem recebimentos registrados neste mês.</p>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: A RECEBER */}
      {activeTab === 'receber' && (
        <section className="flex flex-col gap-2.5">
          <div className="text-[13px] text-[#c8c8c8] px-1">
            {allPendingReceivables.length} show{allPendingReceivables.length !== 1 ? 's' : ''} esperando pagamento ·{' '}
            <strong className="text-white">
              {isVisible ? formatCurrency(totalAllPending) : '•••••'} no total
            </strong>
          </div>

          {allPendingReceivables.length > 0 ? (
            <div className="space-y-2">
              {allPendingReceivables.map((ev) => {
                const cl = clientMap.get(ev.client_id);
                const amount = getEventCacheAmount(ev) || 0;
                const dateStr = ev.start_date ? format(parseISO(ev.start_date), "d 'de' MMMM", { locale: ptBR }) : '';
                const isOverdue = isPaymentOverdue(ev);
                const daysOver = daysOverduePayment(ev);

                return (
                  <div
                    key={ev.id}
                    className="rounded-xl bg-[#161616] border border-[#222222] p-3 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-baseline gap-2">
                      <div className="min-w-0">
                        <div className="text-[15px] font-extrabold text-white truncate">
                          {cl?.name || ev.client_name || 'Cliente'}
                        </div>
                        <div className="text-xs text-[#a8a8a8] truncate mt-0.5">
                          {ev.title} · {dateStr}
                        </div>
                      </div>
                      <span className="font-display text-[22px] text-[#ff2e88] shrink-0">
                        {isVisible ? formatCurrency(amount) : '•••••'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-1 border-t border-[#222222]/60">
                      <span
                        className={`h-6 px-2.5 rounded-full font-mono text-[10px] font-bold flex items-center ${
                          isOverdue
                            ? 'bg-[#ff2e88]/15 text-[#ff2e88] border border-[#ff2e88]/30'
                            : 'bg-[#ffd400]/15 text-[#ffd400] border border-[#ffd400]/30'
                        }`}
                      >
                        {isOverdue ? `${daysOver}d atraso` : 'Aguardando vencimento'}
                      </span>

                      <div className="flex gap-2">
                        {onMarkPaid && (
                          <button
                            type="button"
                            onClick={() => onMarkPaid(ev)}
                            className="h-8 px-3 rounded-full border border-[#333333] bg-transparent text-white font-sans text-xs font-extrabold hover:bg-[#222222] transition-colors flex items-center gap-1 active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Recebi
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openWhatsAppCharge(ev, cl)}
                          className="h-8 px-3 rounded-full border-none bg-[#ff2e88] text-[#0a0a0a] font-sans text-xs font-extrabold hover:opacity-90 transition-opacity flex items-center gap-1 active:scale-95 shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Cobrar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-[#161616] border border-[#222222] p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">Tudo em dia!</p>
              <p className="text-xs text-[#888888] font-mono mt-1">Nenhum show com pagamento pendente.</p>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: FISCAL */}
      {activeTab === 'fiscal' && (
        <section className="flex flex-col gap-2.5">
          <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4">
            <div className="font-mono text-[11px] tracking-wider text-[#a8a8a8]">
              MEI · FATURADO NO ANO
            </div>
            <div className="font-display text-[34px] text-white leading-tight mt-1">
              {isVisible ? formatCurrency(annualTotal) : '••••••••'}
            </div>
            <div className="h-2.5 rounded-full bg-[#2a2a2a] overflow-hidden my-2">
              <div style={{ width: `${meiPct}%` }} className="h-full bg-[#ffd400]" />
            </div>
            <div className="text-xs text-[#c8c8c8]">
              {meiPct}% do limite anual do MEI (R$ 81.000) ·{' '}
              {annualTotal < meiLimit
                ? 'você está seguro dentro do limite anual.'
                : 'atenção: limite anual atingido.'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#161616] border border-[#222222] p-3">
              <div className="font-mono text-[10px] text-[#a8a8a8] uppercase">DAS MEI</div>
              <div className="font-display text-[20px] text-white mt-1">Vence dia 20</div>
              <div className="text-[11px] text-[#ffd400] mt-0.5">Guia mensal PGMEI</div>
            </div>

            <div className="rounded-xl bg-[#161616] border border-[#222222] p-3">
              <div className="font-mono text-[10px] text-[#a8a8a8] uppercase">NOTAS FISCAIS</div>
              <div className="font-display text-[20px] text-white mt-1">
                {events.filter((e) => e.status === 'completed' && !e.nf_number && !e.nfe_numero).length} pendentes
              </div>
              <div className="text-[11px] text-[#a8a8a8] mt-0.5">Shows concluídos</div>
            </div>
          </div>

          {onExportPdf && (
            <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4 flex justify-between items-center gap-3">
              <div>
                <div className="text-[14px] font-extrabold text-white">
                  Resumo para o Imposto de Renda
                </div>
                <div className="text-xs text-[#a8a8a8] mt-0.5">
                  O ano todo estruturado para o contador
                </div>
              </div>
              <button
                type="button"
                onClick={onExportPdf}
                className="h-10 px-4 rounded-full border-none bg-[#ffd400] text-[#0a0a0a] font-sans text-xs font-extrabold hover:bg-[#ffe033] transition-transform active:scale-95 shrink-0 shadow-sm"
              >
                Gerar
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: ANÁLISE */}
      {activeTab === 'analise' && (
        <section className="flex flex-col gap-2.5">
          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3.5 flex gap-3 items-center">
            <div className="font-display text-[26px] text-[#ffd400] min-w-[70px]">
              {monthEvents.length}
            </div>
            <div className="text-[13px] text-[#e0e0e0] leading-snug">
              Shows e trabalhos realizados no mês selecionado.
            </div>
          </div>

          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3.5 flex gap-3 items-center">
            <div className="font-display text-[26px] text-[#ff2e88] min-w-[70px]">
              {totalPending > 0 ? formatCurrency(totalPending) : 'R$ 0'}
            </div>
            <div className="text-[13px] text-[#e0e0e0] leading-snug">
              Valores a receber de shows já confirmados ou aguardando pagamento.
            </div>
          </div>

          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3.5 flex gap-3 items-center">
            <div className="font-display text-[26px] text-emerald-400 min-w-[70px]">
              {totalReceived > 0 ? `${Math.round((totalReceived / (totalReceived + totalPending || 1)) * 100)}%` : '0%'}
            </div>
            <div className="text-[13px] text-[#e0e0e0] leading-snug">
              Taxa de recebimento sobre o faturamento do mês.
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
