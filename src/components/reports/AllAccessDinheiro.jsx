import { useState, useMemo, useEffect, useRef } from 'react';
import { format, subMonths, addMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileDown, CheckCircle2, MessageCircle, ArrowUpRight, Search } from 'lucide-react';
import { getEventCacheAmount, isNfPendingEvent } from '@/lib/eventFinance';
import { buildFinanceDashboard } from '@/lib/financeDashboard';
import { todayLocalISO } from '@/components/utils/dateUtils';
import { openWhatsAppCharge, buildChargeMessage } from '@/lib/whatsapp';
import { appToast } from '@/lib/appToast';
import { MEI_LIMIT } from '@/lib/useBackstageData';
import { useAuth } from '@/lib/authContext';
import { eventFunctionId, categoryLabel } from '@/lib/roleRates';

const TABS = [
  { key: 'mes', label: 'Mês' },
  { key: 'receber', label: 'Empresas · A receber' },
  { key: 'calendario', label: 'Calendário' },
  { key: 'fiscal', label: 'Fiscal' },
  { key: 'analise', label: 'Análise' },
];
const EMPTY_EVENTS = [];
const EMPTY_WORK = {};
const PANEL = 'min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#161616] p-4 sm:p-5';
const BUTTON = 'min-h-10 rounded-full border border-[#333] px-3 text-xs font-bold text-white transition-colors hover:bg-[#2a2a2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]';
const STAGES = { completed: 'Realizado', ongoing: 'Em andamento', upcoming: 'Próximo evento', unknown: 'Datas a conferir' };

function dateLabel(date) {
  return date ? format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem data informada';
}

function Panel({ title, children, className = '', ...rest }) {
  return <section className={PANEL + ' ' + className} {...rest}>
    {title && <h2 className="mb-3 font-tag text-[11px] uppercase tracking-wider text-[#b8b8b8]">{title}</h2>}
    {children}
  </section>;
}

function Empty({ children }) {
  return <p className="py-4 text-sm leading-relaxed text-[#aaa]">{children}</p>;
}

function Metric({ label, value, note, money, pink = false, testId, onClick }) {
  const contents = <>
    <div className="font-tag text-[10px] uppercase tracking-wide text-[#b8b8b8]">{label}</div>
    <div className={'mt-1 break-words font-poster text-[28px] leading-tight ' + (pink ? 'text-[#ff2e88]' : 'text-white')} data-testid={testId}>{money(value)}</div>
    {note && <div className="mt-1 text-[11px] leading-relaxed text-[#aaa]">{note}</div>}
  </>;
  return onClick
    ? <button type="button" onClick={onClick} className={PANEL + ' text-left hover:border-[#ffd400] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]'}>{contents}</button>
    : <div className={PANEL}>{contents}</div>;
}

function EventLedger({ rows, money, onOpenEvent, onMarkPaid, onCharge, kind = 'event', emptyText = 'Nenhum evento nesta seleção.' }) {
  if (!rows.length) return <Empty>{emptyText}</Empty>;
  return <div className="divide-y divide-[#2a2a2a]">
    {rows.map((row) => {
      const pending = row.stage === 'completed' && !row.paid;
      const amount = kind === 'receipt' ? row.receivedAmount : row.amount;
      return <div key={row.id} className="min-w-0 py-3 first:pt-0 last:pb-0">
        <button type="button" onClick={() => onOpenEvent?.(row.event)}
          aria-label={'Abrir evento: ' + (row.event.title || 'Evento')}
          data-testid={'finance-event-' + row.id}
          className="group flex w-full min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]">
          <span className="min-w-0 flex-1 basis-36">
            <span className="block break-words text-sm font-extrabold text-white group-hover:text-[#ffd400]">{row.event.title || 'Evento sem título'}</span>
            <span className="mt-0.5 block text-xs text-[#b8b8b8]">{row.companyName}</span>
            <span className="mt-1 block font-tag text-[10px] leading-relaxed text-[#aaa]">
              {kind === 'receipt' ? 'Recebido em ' + dateLabel(row.receivedDate) : dateLabel(row.startDate) + (row.endDate !== row.startDate ? ' — ' + dateLabel(row.endDate) : '')}
            </span>
          </span>
          <span className={'flex items-center gap-1 break-all font-poster text-[23px] ' + (pending && kind !== 'receipt' ? 'text-[#ff2e88]' : 'text-[#ffd400]')}>
            {money(amount)}<ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </span>
        </button>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className={'font-tag text-[10px] ' + (row.overdue ? 'text-[#ff2e88]' : 'text-[#aaa]')}>
            {kind === 'receipt' ? 'Pagamento registrado' : row.paid ? 'Pago' : pending ? row.dueDate ? (row.overdue ? 'Vencido · ' : 'Vence em ') + dateLabel(row.dueDate) : 'Sem vencimento informado' : STAGES[row.stage]}
          </span>
          {kind !== 'receipt' && row.paid && <span className="text-[11px] text-[#bbb]">Recebido: {money(row.receivedAmount)} · {row.receivedDate ? dateLabel(row.receivedDate) : 'data a conferir'}</span>}
          {['ongoing', 'upcoming'].includes(row.stage) && row.endDate && <span className="text-[11px] text-[#bbb]">Encerramento previsto em {format(parseISO(row.endDate), "MMMM 'de' yyyy", { locale: ptBR })}</span>}
          {pending && kind !== 'receipt' && <div className="flex flex-wrap gap-2">
            {onMarkPaid && <button type="button" onClick={() => onMarkPaid(row.event)} className={BUTTON + ' flex items-center gap-1.5'}>
              <CheckCircle2 className="h-3.5 w-3.5 text-[#ffd400]" aria-hidden="true" />Recebi
            </button>}
            {onCharge && <button type="button" onClick={() => onCharge(row)} className={BUTTON + ' flex items-center gap-1.5'}>
              <MessageCircle className="h-3.5 w-3.5 text-[#ff2e88]" aria-hidden="true" />Cobrar
            </button>}
          </div>}
        </div>
      </div>;
    })}
  </div>;
}

function FinanceCalendar({ dashboard, monthKey, money, isVisible, onOpenEvent }) {
  const [mode, setMode] = useState('work');
  const [selectedDate, setSelectedDate] = useState('');
  const days = dashboard.calendarDays;
  const date = selectedDate.startsWith(monthKey) ? selectedDate : monthKey + '-01';
  const selected = days.find((day) => day.date === date);
  const blanks = days.length ? parseISO(days[0].date).getDay() : 0;
  const chartDays = days.filter((day) => mode === 'work' ? day.works.length : day.receipts.length);
  const chartAmount = (day) => mode === 'work' ? day.earned : day.received;
  const chartMax = Math.max(1, ...chartDays.map(chartAmount));
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-poster text-3xl text-white">CADA DIA CONTA</h2><p className="mt-1 text-xs text-[#aaa]">Trabalho e entrada de dinheiro têm datas diferentes.</p></div>
      <div className="flex gap-1 rounded-full border border-[#333] p-1" aria-label="Visão do calendário">
        {[['work', 'Trabalho'], ['receipts', 'Recebimentos']].map(([key, label]) => <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)}
          className={'min-h-10 rounded-full px-3 text-xs font-bold ' + (mode === key ? 'bg-[#ffd400] text-black' : 'text-[#bbb] hover:text-white')}>{label}</button>)}
      </div>
    </div>
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel title={mode === 'work' ? 'Dias com trabalho registrado' : 'Datas reais dos recebimentos'} data-testid="finance-calendar">
        <div className="grid grid-cols-7 gap-1 text-center">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label, i) => <span key={i} className="pb-2 font-tag text-[10px] text-[#aaa]">{label}</span>)}
          {Array.from({ length: blanks }, (_, i) => <span key={'blank-' + i} aria-hidden="true" />)}
          {days.map((day) => {
            const hasItems = mode === 'work' ? day.works.length > 0 : day.receipts.length > 0;
            const isSelected = date === day.date;
            return <button type="button" key={day.date} data-testid={'finance-calendar-day-' + day.date}
              onClick={() => setSelectedDate(day.date)} aria-pressed={isSelected}
              aria-label={dateLabel(day.date) + (hasItems ? mode === 'work' ? ', trabalho registrado' : ', recebimento registrado' : ', sem registros') + (isVisible && hasItems ? ', ' + money(mode === 'work' ? day.earned : day.received) : '')}
              className={'flex min-h-12 min-w-0 flex-col items-center justify-center rounded-xl border text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ' + (isSelected ? 'border-[#ffd400] bg-[#ffd400] text-black' : hasItems ? 'border-[#665900] bg-[#ffd400]/10 text-[#ffd400]' : 'border-transparent text-[#aaa] hover:bg-[#222]')}>
              {Number(day.date.slice(-2))}
              <span className={'mt-1 h-1 w-1 rounded-full ' + (hasItems ? isSelected ? 'bg-black' : 'bg-[#ffd400]' : 'bg-transparent')} aria-hidden="true" />
            </button>;
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[#aaa]">{mode === 'work' ? 'Somente diárias registradas. Cachê fechado não é dividido entre dias.' : 'Somente pagamentos com data informada; o dia do evento não substitui a data de recebimento.'}</p>
      </Panel>
      <Panel title={'Detalhes de ' + dateLabel(date)} data-testid="finance-day-detail">
        {mode === 'receipts' ? <>
          <div className="mb-4 font-poster text-3xl text-[#ffd400]">{money(selected?.received || 0)}</div>
          <EventLedger rows={selected?.receipts || []} money={money} kind="receipt" onOpenEvent={onOpenEvent} emptyText="Nenhum recebimento registrado neste dia." />
        </> : selected?.works.length ? <div className="space-y-3"><div className="font-poster text-3xl text-[#ffd400]">{money(selected.earned)}</div>{selected.works.map((item, i) => <button type="button" key={item.work.id || i} onClick={() => onOpenEvent?.(item.event)} aria-label={'Abrir evento: ' + (item.event.title || 'Evento')}
          className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-[#333] p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]">
          <span className="min-w-0 flex-1 basis-32"><span className="block text-sm font-bold text-white">{item.event.title || 'Evento'}</span><span className="text-[11px] text-[#aaa]">{item.estimated ? 'Diária estimada · conferir horas' : 'Diária registrada'}</span>{(item.work.total_hours ?? item.work.hours_worked) != null && Number.isFinite(Number(item.work.total_hours ?? item.work.hours_worked)) && <span className="block text-[11px] text-[#aaa]">{Number(item.work.total_hours ?? item.work.hours_worked)} h registradas</span>}</span>
          <span className="font-poster text-2xl text-[#ffd400]">{money(item.amount)}</span>
        </button>)}</div> : <Empty>Nenhuma diária registrada neste dia. Valores de cachê fechado continuam no total do evento.</Empty>}
      </Panel>
    </div>
    <Panel title={mode === 'work' ? 'Ganhos diários registrados' : 'Recebimentos por dia'} data-testid="finance-daily-chart">
      {isVisible ? chartDays.length ? <div className="space-y-3">{chartDays.map((day) => <button type="button" key={day.date} onClick={() => setSelectedDate(day.date)} className="w-full rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]">
        <span className="mb-1 flex flex-wrap justify-between gap-2 text-xs text-[#ccc]"><span>{dateLabel(day.date)}{mode === 'work' && day.works.some((item) => item.estimated) ? ' · inclui diária estimada' : ''}</span><strong>{money(chartAmount(day))}</strong></span>
        <span className="block h-2 rounded-full bg-[#2a2a2a]"><span className="block h-full rounded-full bg-[#ffd400]" style={{ width: chartAmount(day) > 0 ? Math.max(1, chartAmount(day) / chartMax * 100) + '%' : '0%' }} /></span>
      </button>)}</div> : <Empty>{mode === 'work' ? 'Nenhuma diária registrada neste mês.' : 'Nenhum recebimento com data válida neste mês.'}</Empty> : <Empty>Valores e gráficos ocultos.</Empty>}
      <p className="mt-3 text-[11px] text-[#aaa]">{mode === 'work' ? 'Valores dos registros de trabalho, sem dividir cachês fechados. Estimativas permanecem identificadas.' : 'Este gráfico mostra dinheiro recebido, não o ganho pelo trabalho naquele dia.'}</p>
    </Panel>
  </div>;
}

export default function AllAccessDinheiro({
  events = EMPTY_EVENTS, clients = EMPTY_EVENTS, expenses = EMPTY_EVENTS,
  formatCurrency, isVisible = true, onExportPdf, onMarkPaid, workByEvent = EMPTY_WORK,
  receberExtra = null, fiscalExtra = null, analiseExtra = null, initialTab = null,
  onOpenEvent, onMonthChange,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState(() => TABS.some((tab) => tab.key === initialTab) ? initialTab : 'mes');
  const [companySearch, setCompanySearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('Todas');
  const [selectedCompany, setSelectedCompany] = useState('');
  const { profile } = useAuth();
  const monthKey = format(currentDate, 'yyyy-MM');
  const today = todayLocalISO();
  const monthChangeRef = useRef(onMonthChange);
  monthChangeRef.current = onMonthChange;
  useEffect(() => { monthChangeRef.current?.(monthKey); }, [monthKey]);
  useEffect(() => {
    if (TABS.some((tab) => tab.key === initialTab)) setActiveTab(initialTab);
  }, [initialTab]);

  const dashboard = useMemo(() => buildFinanceDashboard({ events, clients, expenses, workByEvent, monthKey, today }), [events, clients, expenses, workByEvent, monthKey, today]);
  const { billedRows, receiptRows, ongoingRows, upcomingRows, companies, monthExpenses, totals, warnings } = dashboard;
  const rowsById = useMemo(() => new Map(dashboard.rows.map((row) => [String(row.id), row])), [dashboard.rows]);
  const monthEvents = useMemo(() => billedRows.map((row) => row.event), [billedRows]);
  const money = (amount) => isVisible ? formatCurrency(amount) : '•••••';
  const slot = (extra) => !isVisible
    ? extra ? <Empty>Valores complementares ocultos.</Empty> : null
    : typeof extra === 'function' ? extra({ currentDate, monthEvents, monthExpenses, dashboard }) : extra;
  const openCompany = (companyKey) => { setSelectedCompany(companyKey); setCompanySearch(''); setCompanyFilter('Todas'); setActiveTab('receber'); };
  const chargeOnWhatsApp = (row) => {
    const msg = buildChargeMessage({
      clientName: row.client?.name || row.companyName,
      events: [{ title: row.event.title, start_date: row.startDate, amount: row.amount }],
      totalAmount: row.amount,
    });
    if (!openWhatsAppCharge(row.client?.phone, msg)) appToast.info('Cadastre o WhatsApp do cliente para cobrar por aqui.');
  };
  const ledgerProps = { money, onOpenEvent, onMarkPaid, onCharge: chargeOnWhatsApp };
  const filteredCompanies = useMemo(() => companies.filter((company) => {
    if (!company.name.toLocaleLowerCase('pt-BR').includes(companySearch.toLocaleLowerCase('pt-BR'))) return false;
    if (companyFilter === 'Pendentes') return company.rows.some((row) => row.stage === 'completed' && !row.paid);
    if (companyFilter === 'Pagos') return company.rows.some((row) => row.paid && row.receivedDate?.startsWith(monthKey));
    if (companyFilter === 'Próximos') return company.rows.some((row) => row.stage === 'upcoming');
    if (companyFilter === 'Em andamento') return company.rows.some((row) => row.stage === 'ongoing');
    if (companyFilter === 'Em atraso') return company.rows.some((row) => row.overdue);
    if (companyFilter === 'Sem vencimento') return company.rows.some((row) => row.stage === 'completed' && !row.paid && !row.dueDate);
    return true;
  }), [companies, companySearch, companyFilter, monthKey]);
  const selected = filteredCompanies.find((company) => company.key === selectedCompany) || filteredCompanies[0];
  const selectedRows = selected?.rows.filter((row) => {
    if (companyFilter === 'Pendentes') return row.stage === 'completed' && !row.paid;
    if (companyFilter === 'Pagos') return row.paid && row.receivedDate?.startsWith(monthKey);
    if (companyFilter === 'Próximos') return row.stage === 'upcoming';
    if (companyFilter === 'Em andamento') return row.stage === 'ongoing';
    if (companyFilter === 'Em atraso') return row.overdue;
    if (companyFilter === 'Sem vencimento') return row.stage === 'completed' && !row.paid && !row.dueDate;
    return true;
  }) || [];
  const composition = companies.filter((company) => company.rows.some((row) => billedRows.some((billed) => billed.id === row.id)));
  const maxRevenue = Math.max(1, ...composition.map((company) => company.revenue));

  const byFunction = useMemo(() => {
    const grouped = new Map();
    for (const row of billedRows) {
      const id = eventFunctionId(row.event, profile) || 'sem';
      const item = grouped.get(id) || { id, label: categoryLabel(id) || 'Sem função', value: 0, count: 0 };
      item.value += row.amount;
      item.count += 1;
      grouped.set(id, item);
    }
    return [...grouped.values()].sort((a, b) => b.value - a.value);
  }, [billedRows, profile]);

  // Preserva o indicador fiscal legado; a competência gerencial não altera sua regra.
  const annualTotal = useMemo(() => events.filter((event) => {
    if (event.status === 'cancelled') return false;
    const date = event.start_date || event.date;
    return date && parseISO(date).getFullYear() === currentDate.getFullYear() && event.payment_status === 'paid';
  }).reduce((sum, event) => sum + (event.paid_amount || getEventCacheAmount(event) || 0), 0), [events, currentDate]);
  const meiPct = Math.min(100, Math.round(annualTotal / MEI_LIMIT * 100));

  return <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-4 text-white">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1 font-tag text-[10px] uppercase tracking-wider text-[#bbb] sm:text-xs">
          <button type="button" aria-label="Mês anterior" data-testid="finance-month-prev" onClick={() => setCurrentDate((date) => subMonths(date, 1))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[#222] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]"><ChevronLeft className="h-4 w-4" /></button>
          <span aria-live="polite">{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</span>
          <button type="button" aria-label="Próximo mês" data-testid="finance-month-next" onClick={() => setCurrentDate((date) => addMonths(date, 1))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[#222] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <h1 className="font-poster text-[40px] leading-none tracking-wide">DINHEIRO</h1>
        <p className="mt-2 text-[11px] text-[#aaa]">Posição em {dateLabel(today)}</p>
      </div>
      {onExportPdf && <button type="button" onClick={() => onExportPdf(monthKey)} className={BUTTON + ' flex items-center gap-2'}><FileDown className="h-4 w-4" aria-hidden="true" />Exportar PDF</button>}
    </header>

    <div role="tablist" aria-label="Visões do financeiro" className="flex gap-1 overflow-x-auto rounded-2xl border border-[#2a2a2a] bg-[#161616] p-1">
      {TABS.map((tab) => <button type="button" role="tab" id={'finance-tab-' + tab.key} aria-controls={'finance-panel-' + tab.key} aria-selected={activeTab === tab.key} key={tab.key} onClick={() => setActiveTab(tab.key)}
        className={'min-h-11 shrink-0 rounded-xl px-3 text-xs font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:flex-1 ' + (activeTab === tab.key ? 'bg-[#ffd400] text-black' : 'text-[#bbb] hover:text-white')}>{tab.label}</button>)}
    </div>

    {warnings.length > 0 && <details className="rounded-xl border border-[#665900] bg-[#ffd400]/5 p-3 text-xs text-[#ddd]">
      <summary className="cursor-pointer font-bold text-[#ffd400]">Dados que precisam de conferência</summary>
      <ul className="mt-2 space-y-1">{warnings.map((warning) => <li key={warning.code}>{warning.label} · {warning.count}</li>)}</ul>
    </details>}

    <div role="tabpanel" id={'finance-panel-' + activeTab} aria-labelledby={'finance-tab-' + activeTab} className="min-w-0">
      {activeTab === 'mes' && <div className="space-y-4">
        <div className="rounded-2xl bg-[#ffd400] p-5 text-[#0a0a0a] sm:p-6">
          <h2 className="font-tag text-xs font-bold uppercase tracking-wider">FATURAMENTO DO MÊS</h2>
          <div data-testid="finance-billed" className="my-1 break-words font-poster text-[clamp(2.3rem,8vw,4rem)] leading-tight">{money(totals.revenue)}</div>
          <p className="text-sm font-bold">Eventos encerrados neste mês · {billedRows.length} trabalho{billedRows.length !== 1 ? 's' : ''}</p>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed">O encerramento define o mês do faturamento. O pagamento entra no mês em que foi recebido.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Entrou no mês" value={totals.received} money={money} note="Pela data real do pagamento" testId="finance-received" />
          <Metric label="Falta receber de realizados" value={totals.pending} money={money} pink note="Saldo em aberto · todos os períodos" testId="finance-pending" onClick={() => { setCompanyFilter('Pendentes'); setSelectedCompany(''); setActiveTab('receber'); }} />
          <Metric label="Despesas do mês" value={totals.expenses} money={money} note="Pela data da despesa registrada" testId="finance-expenses" />
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Panel title="Eventos que fecharam o mês"><EventLedger rows={billedRows} {...ledgerProps} emptyText="Nenhum evento encerrado neste mês." /></Panel>
          <div className="min-w-0 space-y-4">
            <Panel title="De onde veio o faturamento">
              {composition.length ? <div className="space-y-4">{composition.map((company) => <button type="button" key={company.key} onClick={() => openCompany(company.key)} className="w-full rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]">
                <span className="flex flex-wrap items-baseline justify-between gap-2"><span className="min-w-0 text-sm font-bold">{company.name}</span><span className="font-tag text-xs text-[#ffd400]">{money(company.revenue)}</span></span>
                {isVisible && <span className="mt-2 block h-1.5 rounded-full bg-[#2a2a2a]" aria-hidden="true"><span className="block h-full rounded-full bg-[#ffd400]" style={{ width: Math.max(1, company.revenue / maxRevenue * 100) + '%' }} /></span>}
              </button>)}</div> : <Empty>As empresas aparecem quando houver faturamento no mês.</Empty>}
              <p className="mt-3 text-[11px] text-[#aaa]">Toque em uma empresa para conferir seus eventos e saldos.</p>
            </Panel>
            <Panel title="Recebimentos deste mês"><EventLedger rows={receiptRows} money={money} onOpenEvent={onOpenEvent} kind="receipt" emptyText="Nenhum recebimento com data informada neste mês." /></Panel>
          </div>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Panel title="Em andamento">
            <div data-testid="finance-ongoing" className="mb-3 font-poster text-3xl text-[#ffd400]">{money(totals.ongoing)}</div>
            <EventLedger rows={ongoingRows} money={money} onOpenEvent={onOpenEvent} emptyText="Nenhum evento em andamento neste período." />
            <p className="mt-3 text-[11px] text-[#aaa]">Valores previstos até o encerramento e a conferência das horas.</p>
          </Panel>
          <Panel title="Próximos eventos">
            <div data-testid="finance-upcoming" className="mb-3 font-poster text-3xl text-[#bbb]">{money(totals.upcoming)}</div>
            <EventLedger rows={upcomingRows} money={money} onOpenEvent={onOpenEvent} emptyText="Nenhum próximo evento neste período." />
            <p className="mt-3 text-[11px] text-[#aaa]">Previsões dos eventos que passam por este mês; não integram o faturamento realizado.</p>
          </Panel>
        </div>
        <Panel title="Despesas registradas no mês" data-testid="finance-expense-ledger">
          {monthExpenses.length ? <div className="divide-y divide-[#2a2a2a]">{monthExpenses.map((expense, index) => {
            const linked = rowsById.get(String(expense.event_id));
            const description = expense.description || expense.title || expense.category || 'Despesa';
            return <div key={expense.id || index} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1 basis-40"><p className="break-words text-sm font-bold">{description}</p><p className="mt-1 text-[11px] text-[#aaa]">{dateLabel(expense.expense_date || expense.date)}</p>
                {linked && <button type="button" onClick={() => onOpenEvent?.(linked.event)} className="mt-1 min-h-10 text-left text-xs text-[#ffd400] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400]">{linked.companyName} · {linked.event.title || 'Evento'}</button>}
              </div><span className="font-poster text-2xl">{money(expense.amount)}</span>
            </div>;
          })}</div> : <Empty>Nenhuma despesa registrada neste mês.</Empty>}
        </Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2a2a2a] px-4 py-3">
          <span className="text-xs text-[#aaa]">Resultado de caixa do mês<br /><span className="text-[10px]">Entradas menos despesas registradas; não representa saldo bancário ou lucro contábil.</span></span>
          <span data-testid="finance-cash" className="font-poster text-3xl">{money(totals.cash)}</span>
        </div>
      </div>}

      {activeTab === 'receber' && <div className="space-y-4">
        <div><h2 className="font-poster text-3xl">EMPRESAS EM FOCO</h2><p className="mt-1 text-xs text-[#aaa]">Recebimentos do mês, saldo de realizados de todos os períodos e previsões separados.</p></div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.4fr)]">
          <Panel title="Suas empresas" data-testid="finance-companies">
            <label className="flex items-center gap-2 rounded-xl border border-[#333] px-3">
              <Search className="h-4 w-4 shrink-0 text-[#aaa]" aria-hidden="true" /><input type="search" aria-label="Buscar empresa" value={companySearch} onChange={(event) => setCompanySearch(event.target.value)} placeholder="Buscar empresa" className="min-h-11 w-full min-w-0 bg-transparent text-sm text-white placeholder:text-[#999] focus:outline-none" />
            </label>
            <div className="my-3 flex flex-wrap gap-1.5" aria-label="Filtrar empresas">{['Todas', 'Pendentes', 'Pagos', 'Próximos', 'Em andamento', 'Em atraso', 'Sem vencimento'].map((filter) => <button type="button" key={filter} onClick={() => setCompanyFilter(filter)} aria-pressed={companyFilter === filter} className={BUTTON + (companyFilter === filter ? ' border-[#ffd400] bg-[#ffd400] !text-black' : '')}>{filter}</button>)}</div>
            {filteredCompanies.length ? <div className="space-y-2">{filteredCompanies.map((company) => <button type="button" key={company.key} data-testid={'finance-company-' + company.key} aria-pressed={selected?.key === company.key} onClick={() => setSelectedCompany(company.key)} className={'w-full min-w-0 rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400] ' + (selected?.key === company.key ? 'border-[#ffd400] bg-[#ffd400]/5' : 'border-[#333] hover:border-[#777]')}>
              <span className="block break-words text-sm font-extrabold">{company.name}</span>
              <span className="mt-1 block font-tag text-[10px] text-[#aaa]">{company.rows.length} evento{company.rows.length !== 1 ? 's' : ''} na seleção</span>
              <span className="mt-2 block text-xs text-[#bbb]">Recebido no mês · {money(company.received)}</span>
              {company.pending > 0 && <span className="mt-1 block text-xs text-[#ff2e88]">Pendente de realizados · {money(company.pending)}</span>}
              {company.upcoming > 0 && <span className="mt-1 block text-xs text-[#aaa]">Próximos eventos · {money(company.upcoming)}</span>}
            </button>)}</div> : <Empty>Nenhuma empresa corresponde à seleção.</Empty>}
          </Panel>
          <Panel title={selected?.name || 'Eventos e saldos'} data-testid="finance-company-detail">
            {selected ? <>
              <dl className="mb-4 space-y-2 rounded-xl bg-[#0a0a0a] p-3 text-xs">
                {[['Faturamento do mês', selected.revenue], ['Recebido no mês', selected.received], ['Saldo de realizados · todos os períodos', selected.pending], ['Em andamento · previsão', selected.ongoing], ['Próximos · previsão', selected.upcoming]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-[#aaa]">{label}</dt><dd className="font-bold">{money(value)}</dd></div>)}
              </dl>
              <h3 className="mb-3 font-tag text-[11px] uppercase tracking-wider text-[#aaa]">Eventos e saldos</h3>
              <EventLedger rows={selectedRows} {...ledgerProps} kind={companyFilter === 'Pagos' ? 'receipt' : 'event'} />
            </> : <Empty>Selecione uma empresa para conferir o histórico.</Empty>}
          </Panel>
        </div>
        {receberExtra && <details className={PANEL}><summary className="cursor-pointer text-xs font-bold">Informações complementares</summary><div className="mt-3">{slot(receberExtra)}</div></details>}
      </div>}

      {activeTab === 'calendario' && <FinanceCalendar dashboard={dashboard} monthKey={monthKey} money={money} isVisible={isVisible} onOpenEvent={onOpenEvent} />}

      {activeTab === 'fiscal' && <div className="space-y-4">
        <Panel title="MEI · Faturado no ano">
          <div className="font-poster text-4xl">{money(annualTotal)}</div>
          {isVisible ? <><div className="my-3 h-2.5 overflow-hidden rounded-full bg-[#2a2a2a]"><div style={{ width: meiPct + '%' }} className="h-full bg-[#ffd400]" /></div><p className="text-xs text-[#ccc]">{meiPct}% do limite anual do MEI (R$ 81.000) · {annualTotal < MEI_LIMIT ? 'você está seguro dentro do limite anual.' : 'atenção: limite anual atingido.'}</p></> : <Empty>Valores e indicador fiscal ocultos.</Empty>}
        </Panel>
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel title="DAS MEI"><div className="font-poster text-2xl">Vence dia 20</div><p className="mt-1 text-xs text-[#ffd400]">Guia mensal PGMEI</p></Panel>
          <Panel title="Notas fiscais"><div className="font-poster text-2xl">{events.filter(isNfPendingEvent).length} pendentes</div><p className="mt-1 text-xs text-[#aaa]">Shows feitos sem nota</p></Panel>
        </div>
        {slot(fiscalExtra)}
      </div>}

      {activeTab === 'analise' && <div className="space-y-4">
        <Panel title="Trabalhos encerrados no mês"><div className="font-poster text-4xl text-[#ffd400]">{billedRows.length}</div><p className="mt-2 text-xs text-[#aaa]">Faturamento pelo encerramento; eventos futuros ficam na previsão.</p></Panel>
        <Metric label="Realizados do mês ainda não pagos" value={billedRows.filter((row) => !row.paid).reduce((sum, row) => sum + row.amount, 0)} money={money} pink />
        {byFunction.length > 1 && <Panel title="Por função" data-testid="por-funcao">
          <div className="space-y-3">{byFunction.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-bold">{item.label} <span className="font-tag text-[10px] text-[#aaa]">{item.count}×</span></span><span className="font-tag text-xs text-[#ffd400]">{money(item.value)}</span></div>)}</div>
          <p className="mt-3 text-[11px] text-[#aaa]">Eventos encerrados no mês, pelo valor de cada trabalho.</p>
        </Panel>}
        <Panel title="O que cada número representa"><p className="text-xs leading-relaxed text-[#bbb]">Faturamento e recebimentos têm datas de referência diferentes. Comparar suas somas não mede a taxa de pagamento dos mesmos eventos. Despesas não registradas também não entram no saldo apresentado.</p></Panel>
        {slot(analiseExtra)}
      </div>}
    </div>
  </div>;
}
