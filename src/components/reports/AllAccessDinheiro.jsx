import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  parseISO,
  isSameMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileDown, CheckCircle2, MessageCircle } from 'lucide-react';
import { getEventCacheAmount, isPaymentOverdue, daysOverduePayment, isNfPendingEvent } from '@/lib/eventFinance';
import { openWhatsAppCharge, buildChargeMessage } from '@/lib/whatsapp';
import { appToast } from '@/lib/appToast';
import { paidEventsInPeriod, sumReceived, getEventReceivedAmount, getEventReceivedDate } from '@/lib/financeMetrics';

export default function AllAccessDinheiro({
  events = [],
  clients = [],
  expenses = [],
  formatCurrency,
  isVisible = true,
  onExportPdf,
  onMarkPaid,
  workByEvent = {},
  // Relatorios completos que voltaram ao visual novo (21/10): cada aba recebe o seu bloco.
  receberExtra = null,
  fiscalExtra = null,
  analiseExtra = null,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState('mes'); // 'mes', 'receber', 'fiscal', 'analise'

  // "Cobrar": monta a mesma mensagem dos Avisos e abre o WhatsApp do cliente.
  const chargeOnWhatsApp = (ev, cl) => {
    const amount = getEventCacheAmount(ev);
    const msg = buildChargeMessage({
      clientName: cl?.name,
      events: [{ title: ev.title, start_date: ev.start_date, amount }],
      totalAmount: amount,
    });
    if (!openWhatsAppCharge(cl?.phone, msg)) {
      appToast.info('Cadastre o WhatsApp do cliente para cobrar por aqui.');
    }
  };

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

  // Os blocos extras podem ser funcao: recebem o mes que esta na tela.
  const slot = (extra) => (typeof extra === 'function' ? extra({ currentDate, monthEvents, monthExpenses }) : extra);

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
  // Recebido = pela DATA DO PAGAMENTO (mesma regra de Início, Metas e Relatórios).
  const totalReceived = useMemo(() => {
    const range = { start: monthStart, end: monthEnd };
    return sumReceived(paidEventsInPeriod(events, range), workByEvent);
  }, [events, workByEvent, monthStart, monthEnd]);

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
    const r = sumReceived(
      paidEventsInPeriod(events, { start: startOfMonth(prevMonthDate), end: endOfMonth(prevMonthDate) }),
      workByEvent
    );
    const exp = prevMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return r - exp;
  }, [events, workByEvent, prevMonthDate, prevMonthExpenses]);

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
    const weekOf = (dateStr) => {
      const d = dateStr ? parseISO(String(dateStr).slice(0, 10)) : null;
      if (!d) return -1;
      return Math.min(Math.floor((d.getDate() - 1) / 7), 4);
    };
    // Recebido: semana da data do pagamento
    for (const ev of paidEventsInPeriod(events, { start: monthStart, end: monthEnd })) {
      const wi = weekOf(getEventReceivedDate(ev));
      if (wi >= 0) weeks[wi].got += getEventReceivedAmount(ev, workByEvent[ev.id] || []);
    }
    // A receber: semana da data do show
    for (const ev of monthEvents) {
      if (ev.payment_status === 'paid') continue;
      const wi = weekOf(ev.start_date);
      if (wi >= 0) weeks[wi].due += getEventCacheAmount(ev) || 0;
    }
    const maxVal = Math.max(1, ...weeks.map((w) => w.got + w.due));
    return weeks.map((w) => ({
      ...w,
      gotHeight: `${Math.round((w.got / maxVal) * 80)}%`,
      dueHeight: `${Math.round((w.due / maxVal) * 80)}%`,
    }));
  }, [events, monthEvents, workByEvent, monthStart, monthEnd]);

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
          <div className="flex items-center gap-1.5 font-tag text-[11px] tracking-[2px] text-[#a8a8a8]">
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
          <h1 className="font-poster text-[38px] sm:text-[40px] text-white leading-none tracking-wide uppercase">
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
            <div className="font-tag text-[11px] font-bold tracking-wider">
              SOBROU NO BOLSO
            </div>
            <div className="font-poster text-[44px] sm:text-[48px] leading-tight my-0.5">
              {isVisible ? formatCurrency(netPocket) : '••••••••'}
            </div>
            <div className="text-[13px] font-bold opacity-90">
              {netComparisonText}
            </div>
          </div>

          {/* 3 Metrics Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-xl bg-[#161616] border border-[#222222] p-2.5">
              <div className="font-tag text-[10px] text-[#a8a8a8] uppercase truncate">
                RECEBIDO
              </div>
              <div className="font-poster text-[20px] text-white leading-none mt-1 truncate">
                {isVisible ? formatCurrency(totalReceived) : '•••••'}
              </div>
            </div>

            <div className="rounded-xl bg-[#161616] border border-[#222222] p-2.5">
              <div className="font-tag text-[10px] text-[#a8a8a8] uppercase truncate">
                A RECEBER
              </div>
              <div className="font-poster text-[20px] text-[#ff2e88] leading-none mt-1 truncate">
                {isVisible ? formatCurrency(totalPending) : '•••••'}
              </div>
            </div>

            <div className="rounded-xl bg-[#161616] border border-[#222222] p-2.5">
              <div className="font-tag text-[10px] text-[#a8a8a8] uppercase truncate">
                DESPESAS
              </div>
              <div className="font-poster text-[20px] text-white leading-none mt-1 truncate">
                {isVisible ? formatCurrency(totalExpense) : '•••••'}
              </div>
            </div>
          </div>

          {/* Semana a Semana Dual-Bar Chart */}
          <div className="rounded-2xl bg-[#161616] border border-[#222222] p-3.5">
            <div className="font-tag text-[11px] tracking-wider text-[#a8a8a8] mb-3">
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
                  <span className="font-tag text-[10px] text-[#a8a8a8]">{w.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#222222] font-tag text-[10px] text-[#a8a8a8]">
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
            <div className="font-tag text-[11px] tracking-wider text-[#a8a8a8] mb-2">
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
                    <span className="font-tag text-[12px] text-white w-20 text-right truncate">
                      {isVisible ? formatCurrency(c.value) : '•••••'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#888888] font-tag">Sem recebimentos registrados neste mês.</p>
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
                      <span className="font-poster text-[22px] text-[#ff2e88] shrink-0">
                        {isVisible ? formatCurrency(amount) : '•••••'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-1 border-t border-[#222222]/60">
                      <span
                        className={`h-6 px-2.5 rounded-full font-tag text-[10px] font-bold flex items-center ${
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
                          onClick={() => chargeOnWhatsApp(ev, cl)}
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
              <p className="text-xs text-[#888888] font-tag mt-1">Nenhum show com pagamento pendente.</p>
            </div>
          )}
          {slot(receberExtra)}
        </section>
      )}

      {/* TAB 3: FISCAL */}
      {activeTab === 'fiscal' && (
        <section className="flex flex-col gap-2.5">
          <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4">
            <div className="font-tag text-[11px] tracking-wider text-[#a8a8a8]">
              MEI · FATURADO NO ANO
            </div>
            <div className="font-poster text-[34px] text-white leading-tight mt-1">
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
              <div className="font-tag text-[10px] text-[#a8a8a8] uppercase">DAS MEI</div>
              <div className="font-poster text-[20px] text-white mt-1">Vence dia 20</div>
              <div className="text-[11px] text-[#ffd400] mt-0.5">Guia mensal PGMEI</div>
            </div>

            <div className="rounded-xl bg-[#161616] border border-[#222222] p-3">
              <div className="font-tag text-[10px] text-[#a8a8a8] uppercase">NOTAS FISCAIS</div>
              <div className="font-poster text-[20px] text-white mt-1">
                {events.filter(isNfPendingEvent).length} pendentes
              </div>
              <div className="text-[11px] text-[#a8a8a8] mt-0.5">Shows concluídos</div>
            </div>
          </div>

          {slot(fiscalExtra)}
        </section>
      )}

      {/* TAB 4: ANÁLISE */}
      {activeTab === 'analise' && (
        <section className="flex flex-col gap-2.5">
          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3.5 flex gap-3 items-center">
            <div className="font-poster text-[26px] text-[#ffd400] min-w-[70px] shrink-0">
              {monthEvents.length}
            </div>
            <div className="text-[13px] text-[#e0e0e0] leading-snug">
              Shows e trabalhos realizados no mês selecionado.
            </div>
          </div>

          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3.5 flex gap-3 items-center">
            <div className="font-poster text-[26px] text-[#ff2e88] min-w-[70px] shrink-0">
              {totalPending > 0 ? formatCurrency(totalPending) : 'R$ 0'}
            </div>
            <div className="text-[13px] text-[#e0e0e0] leading-snug">
              Valores a receber de shows já confirmados ou aguardando pagamento.
            </div>
          </div>

          <div className="rounded-xl bg-[#161616] border border-[#222222] p-3.5 flex gap-3 items-center">
            <div className="font-poster text-[26px] text-emerald-400 min-w-[70px] shrink-0">
              {totalReceived > 0 ? `${Math.round((totalReceived / (totalReceived + totalPending || 1)) * 100)}%` : '0%'}
            </div>
            <div className="text-[13px] text-[#e0e0e0] leading-snug">
              Taxa de recebimento sobre o faturamento do mês.
            </div>
          </div>
          {slot(analiseExtra)}
        </section>
      )}
    </div>
  );
}
