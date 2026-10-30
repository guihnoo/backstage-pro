import { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { todayLocalISO } from '@/components/utils/dateUtils';
import { openWhatsAppCharge, buildChargeMessage } from '@/lib/whatsapp';
import { appToast } from '@/lib/appToast';
import FinanceLegacyPanels from './FinanceLegacyPanels';
import './financeExplorer.css';
import { createFinanceExplorerModel, buildFinanceMetricDetails, getPaymentReminderTiming, sum, shiftMonth } from '@/lib/financeExplorer';
const tabs = [['month', 'Mês'], ['companies', 'Empresas · A receber'], ['calendar', 'Calendário'], ['compare', 'Comparações'], ['future', 'Próximos meses'], ['review', 'Conferência'], ['fiscal', 'Fiscal'], ['analise', 'Análise']];
const metricNames = {
  received: 'Recebido registrado',
  revenue: 'Faturamento do mês',
  pending: 'Falta receber deste mês',
  expenses: 'Despesas do mês',
  cash: 'Resultado de caixa do mês',
  ongoing: 'Em andamento',
  upcoming: 'Próximos eventos'
};
const dateLabel = v => v ? String(v).slice(0, 10).split('-').reverse().join('/') : 'Sem data informada';
const monthLabel = v => new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
}).format(new Date(v + '-01T12:00:00Z'));
const dateSource = row => row.receivedDateEstimated ? 'Data estimada · encerramento +' + (row.receivedDateEstimateDays || 10) + ' dias' : 'Data cadastrada no recebimento';
const amountSource = row => row.amountSource === 'payment' ? 'Valor informado no recebimento' : row.amountSource === 'actual' ? 'Valor antigo do evento · conferir' : 'Cálculo de cachê e diárias';
const EMPTY = [];
const EMPTY_WORK = {};
const tabAlias = {
  mes: 'month',
  receber: 'companies',
  calendario: 'calendar'
};
export default function AllAccessDinheiro({
  events = EMPTY,
  clients = EMPTY,
  expenses = EMPTY,
  workByEvent = EMPTY_WORK,
  formatCurrency,
  isVisible = true,
  onExportPdf,
  onMarkPaid,
  onOpenEvent,
  onMonthChange,
  initialTab,
  receberExtra,
  fiscalExtra,
  analiseExtra
}) {
  const today = todayLocalISO();
  const initial = tabAlias[initialTab] || initialTab || 'month';
  const [month, setMonth] = useState(() => today.slice(0, 7)),
    [tab, setTab] = useState(initial);
  const visible = isVisible;
  const monthChange = useRef(onMonthChange);
  monthChange.current = onMonthChange;
  useEffect(() => {
    monthChange.current?.(month);
  }, [month]);
  useEffect(() => {
    if (tabs.some(([key]) => key === initial)) setTab(initial);
  }, [initial]);
  const [search, setSearch] = useState(''),
    [companyFilter, setCompanyFilter] = useState('Todas'),
    [metric, setMetric] = useState('received'),
    [company, setCompany] = useState(''),
    [equivalent, setEquivalent] = useState(true),
    [calendarMode, setCalendarMode] = useState('received');
  const [stack, setStack] = useState([]);
  const trigger = useRef(null);
  const model = useMemo(() => createFinanceExplorerModel({
    events,
    clients,
    expenses,
    workByEvent,
    today
  }), [events, clients, expenses, workByEvent, today]);
  const d = model.dashboard(month);
  const money = v => visible ? formatCurrency(Number(v || 0)) : '•••••';
  const pendingMonth = sum(d.billedRows.filter(r => !r.paid));
  const current = stack.at(-1);
  const open = desc => {
    if (!stack.length) trigger.current = document.activeElement;
    setStack(prev => [...prev, {
      month: current?.month || month,
      ...desc
    }]);
  };
  const close = () => {
    setStack([]);
    setTimeout(() => trigger.current?.focus(), 0);
  };
  const back = () => stack.length > 1 ? setStack(prev => prev.slice(0, -1)) : close();
  const card = (label, value, action, note = '', className = '', testId) => <button key={testId || label} type="button" data-testid={testId} className={'card ' + className} aria-label={'Ver detalhes: ' + label} onClick={action}><span className="eyebrow">{label}</span><strong className="amount">{typeof value === 'number' ? money(value) : value}</strong><span className="note">{note || 'Ver registros e composição'}</span><span className="card-arrow" aria-hidden="true">↗</span></button>;
  const metricCard = (key, total, note = '', klass = '') => card(metricNames[key], total, () => open({
    type: 'metric',
    metric: key
  }), note, klass, 'finance-' + (key === 'revenue' ? 'billed' : key));
  function ledger(rows, kind = 'event') {
    return rows.length ? <div className="ledger">{rows.map((row, i) => kind === 'expense' ? <button key={row.id || i} className="ledger-row" onClick={() => open({
        type: 'expense',
        id: row.id
      })}><span><b>{row.title || row.description || row.category || 'Despesa'}</b><small>{dateLabel(row.expense_date || row.date)}</small></span><strong>{money(row.amount)} ↗</strong></button> : <button key={row.id || i} className="ledger-row" aria-label={'Abrir evento: ' + ((row.event || row).title || 'Evento')} onClick={() => open({
        type: 'event',
        id: row.event?.id || row.id
      })}><span><b>{row.companyName || model.clients.find(c => c.id === (row.event || row).client_id)?.name || 'Sem empresa'}</b><span className="event-name">{(row.event || row).title || 'Evento'}</span><small>{kind === 'receipt' ? 'Recebido: ' + dateLabel(row.receivedDate) : 'Encerramento: ' + dateLabel(row.endDate)}</small><span className={'badge ' + (row.paid ? '' : 'pink')}>{kind === 'receipt' ? dateSource(row) : row.paid ? row.amountSource === 'calculated' ? 'Valor recebido a confirmar' : 'Pagamento registrado' : 'Ainda não pago'}</span></span><strong>{model.hasValue(row) ? money(kind === 'receipt' ? row.receivedAmount : row.amount) : 'Valor a definir'} ↗</strong></button>)}</div> : <p className="empty">Sem registros neste recorte.</p>;
  }
  const statusReview = [{
    key: 'dates',
    title: 'Datas estimadas',
    rows: model.all.rows.filter(r => r.receivedDateEstimated),
    note: 'Datas reconstruídas por estimativa e identificadas no histórico.'
  }, {
    key: 'missing',
    title: 'Valor recebido não informado',
    rows: model.all.rows.filter(r => r.paid && r.amountSource === 'calculated'),
    note: 'Fora do recebido confirmado e do caixa.'
  }, {
    key: 'legacy',
    title: 'Valores de cadastro antigo',
    rows: model.all.rows.filter(r => r.paid && r.amountSource === 'actual'),
    note: 'Valor final no evento, sem valor próprio do recebimento.'
  }, {
    key: 'differences',
    title: 'Diferenças para o cálculo',
    rows: model.all.rows.filter(r => r.paid && r.amountSource !== 'calculated' && Math.round(r.receivedAmount * 100) !== Math.round(r.calculatedAmount * 100)),
    note: 'Pagamento informado preservado; cálculo mostrado para comparação.'
  }, {
    key: 'reminders',
    title: 'Pendências a partir do dia 10',
    rows: model.all.rows.filter(r => getPaymentReminderTiming(r.event, today)),
    note: 'Pagamentos não concluídos. Vencido somente com vencimento informado.'
  }];
  function companyBody(id, selectedMonth) {
    const month = selectedMonth;
    const c = model.clients.find(c => c.id === id);
    const cd = model.dashboard(month, id);
    const relevant = cd.rows.filter(r => r.stage !== 'completed' || !r.paid || r.revenueDate?.startsWith(month) || r.receivedDate?.startsWith(month));
    const debt = model.all.rows.filter(r => r.companyKey === id && r.stage === 'completed' && !r.paid);
    return <><p className="muted">{monthLabel(month)} · {c?.name || 'Empresa'} · cada indicador abre somente os registros daquele valor.</p><div className="grid two">{['received', 'revenue', 'expenses'].map(key => card(metricNames[key], cd.totals[key === 'revenue' ? 'revenue' : key], () => open({
          type: 'metric',
          metric: key,
          company: id
        }), monthLabel(month)))}{card('A receber de realizados', sum(debt), () => open({
          type: 'group',
          title: 'Histórico em aberto · ' + c?.name,
          rows: debt
        }), 'Todos os períodos')}</div><h3>Evolução mensal · {metricNames[metric]}</h3>{historyBars(id, month)}<h3>Eventos e saldos da empresa</h3>{ledger(relevant)}</>;
  }
  function historyBars(cid = null, selectedMonth = month) {
    const months = Array.from({
      length: 6
    }, (_, i) => shiftMonth(selectedMonth, i - 5));
    const values = months.map(m => model.metric(m, metric, cid));
    const max = Math.max(1, ...values.map(v => v.total));
    return <div className="bars">{months.map((m, i) => <button className="bar-row" key={m} onClick={() => open({
        type: 'metric',
        metric,
        company: cid,
        month: m
      })}><span>{monthLabel(m)}<b>{money(values[i].total)}</b></span><i><em style={{
            width: visible ? Math.max(0, values[i].total / max * 100) + '%' : '0%'
          }} /></i></button>)}</div>;
  }
  function comparisonBody(desc) {
    const comparison = model.compare(desc.month, desc.metric, desc.company || null, desc.equivalent ?? equivalent);
    const kind = desc.metric === 'received' ? 'receipt' : desc.metric === 'expenses' ? 'expense' : 'event';
    return <><p className="muted">{desc.metric === 'received' ? 'Pagamentos pela data cadastrada do depósito' : desc.metric === 'revenue' ? 'Trabalhos pelo encerramento' : 'Despesas pela data cadastrada'}. {comparison.partial ? 'Recortes até o mesmo dia de cada mês.' : 'Recortes de meses completos; mês atual só possui registros até hoje.'}</p><div className="grid two"><div className="inset"><small>{monthLabel(desc.month)} · até {dateLabel(comparison.currentEnd)}</small><strong className="amount">{money(comparison.current.total)}</strong></div><div className="inset"><small>{monthLabel(comparison.previous)} · até {dateLabel(comparison.previousEnd)}</small><strong className="amount">{money(comparison.prior.total)}</strong></div></div><p className="comparison-note">Diferença: <b>{money(comparison.delta)}</b> · {comparison.percent === null ? 'Sem base para percentual' : visible ? comparison.percent.toFixed(1) + '%' : '•••'}</p><h3>Registros do mês selecionado · {comparison.current.rows.length}</h3>{ledger(comparison.current.rows, kind)}<h3>Registros do mês anterior · {comparison.prior.rows.length}</h3>{ledger(comparison.prior.rows, kind)}<p className="footnote">Comparação dos dados cadastrados. Datas estimadas, datas históricas a revisar e valores antigos precisam ser considerados ao interpretar a variação.</p></>;
  }
  function renderModal(desc) {
    if (!desc) return {
      title: '',
      body: null
    };
    const md = model.dashboard(desc.month || month, desc.company || null);
    if (desc.type === 'metric') {
      const detail = buildFinanceMetricDetails(md, desc.metric);
      const companyName = desc.company ? model.clients.find(c => c.id === desc.company)?.name : '';
      return {
        title: metricNames[desc.metric] + (companyName ? ' · ' + companyName : ''),
        body: <><p className="muted">{monthLabel(desc.month)} · {detail.description}</p><div className="modal-total" data-testid="finance-metric-total"><small>Total dos registros desta composição</small><strong>{money(detail.total)}</strong></div>{desc.metric === 'cash' && <p data-testid="finance-cash-formula">{money(md.totals.received)} recebidos − {money(md.totals.expenses)} despesas = {money(md.totals.cash)}</p>}{detail.sections.map((s, i) => <section key={i} data-testid={'finance-metric-section-' + i}><h3>{s.title} · {s.rows.length}<span className="section-total">{s.excluded ? 'Não somado' : money(s.total)}</span></h3>{s.rows.length ? s.rows.map((entry, n) => <button className="ledger-row" key={entry.id || n} aria-label={'Abrir ' + (s.kind === 'expense' ? 'despesa' : 'evento') + ': ' + entry.title} onClick={() => open({
              type: s.kind === 'expense' ? 'expense' : 'event',
              id: s.kind === 'expense' ? entry.id : entry.event?.id || entry.id,
              expenseId: entry.id
            })}><span><b>{entry.company}</b><span className="event-name">{entry.title}</span><small>{s.kind === 'receipt' ? 'Recebimento: ' + dateLabel(entry.receivedDate) : s.kind === 'expense' ? 'Despesa: ' + dateLabel(entry.date) : 'Encerramento: ' + dateLabel(entry.endDate)}</small><span className="badge">{entry.source}</span>{entry.event && <small>Cálculo pelo cachê e diárias: {money(model.all.rows.find(r => r.id === entry.event.id)?.calculatedAmount)}</small>}{entry.receivedDateEstimated && <span className="badge warning">Data estimada · +10 dias</span>}</span><strong>{s.excluded ? 'Referência: ' : ''}{money(entry.amount)} ↗</strong></button>) : <p className="empty">Sem registros nesta composição.</p>}</section>)}<p className="footnote">O valor informado em “Recebi” tem prioridade. A origem da data é independente da origem do valor.</p></>
      };
    }
    if (desc.type === 'event') {
      const r = model.all.rows.find(r => r.id === desc.id);
      const original = r?.event.paid_date_meta;
      if (!r) return {
        title: 'Evento',
        body: <p>Registro não encontrado na sua conta.</p>
      };
      const works = model.workByEvent[r.id] || [];
      const expenses = model.expenses.filter(e => e.event_id === r.id);
      return {
        title: r.companyName,
        body: <><p className="muted">{r.event.title} · {dateLabel(r.startDate)} — {dateLabel(r.endDate)}</p><div className="modal-total"><small>{r.paid ? r.amountSource === 'payment' ? 'Valor informado no recebimento' : r.amountSource === 'actual' ? 'Valor antigo do evento · conferir' : 'Referência calculada · pagamento sem valor final' : 'Valor do trabalho cadastrado'}</small><strong>{model.hasValue(r) ? money(r.paid && r.amountSource !== 'calculated' ? r.receivedAmount : r.amount) : 'Valor a definir'}</strong><span className="badge">{amountSource(r)}</span></div><dl><div><dt>Situação</dt><dd>{r.paid ? 'Marcado como pago' : r.stage === 'completed' ? 'Realizado · pagamento pendente' : r.stage === 'upcoming' ? 'Evento futuro' : 'Em andamento'}</dd></div><div><dt>Mês do faturamento</dt><dd>{r.endDate ? monthLabel(r.endDate.slice(0, 7)) : 'Data a conferir'}</dd></div><div><dt>Data de recebimento</dt><dd>{dateLabel(r.receivedDate)}</dd></div>{r.paid && <div><dt>Origem da data</dt><dd>{dateSource(r)}</dd></div>}{r.receivedDateEstimated && <div><dt>Data registrada anteriormente</dt><dd>{dateLabel(original?.original_paid_date)} · registro anterior à reconstrução</dd></div>}<div><dt>Vencimento informado</dt><dd>{r.dueDate ? dateLabel(r.dueDate) : 'Sem prazo informado'}</dd></div><div><dt>Cálculo de cachê e diárias</dt><dd>{money(r.calculatedAmount)}</dd></div>{r.paid && r.amountSource !== 'calculated' && <div><dt>Diferença para o pagamento</dt><dd>{money((Math.round(r.receivedAmount * 100) - Math.round(r.calculatedAmount * 100)) / 100)}</dd></div>}</dl><h3>Complementos deste evento</h3><div className="grid two">{card('Registros de trabalho', String(works.length), () => open({
              type: 'workGroup',
              id: r.id
            }), 'Ver dias, valores e horas cadastradas')}{card('Despesas vinculadas', sum(expenses), () => open({
              type: 'expensesGroup',
              rows: expenses,
              title: 'Despesas · ' + r.companyName
            }), expenses.length + ' registros')}</div><button className="action" onClick={() => open({
            type: 'company',
            id: r.companyKey
          })}>Ver histórico da empresa ↗</button><div className="filters">{!r.paid && r.stage === 'completed' && onMarkPaid && <button className="action" onClick={() => {
              close();
              onMarkPaid(r.event);
            }}>Recebi</button>}{!r.paid && r.stage === 'completed' && <button className="action" onClick={() => charge(r)}>Cobrar</button>}{onOpenEvent && <button className="action" onClick={() => {
              close();
              onOpenEvent(r.event);
            }}>Abrir evento completo ↗</button>}</div></>
      };
    }
    if (desc.type === 'company') return {
      title: model.clients.find(c => c.id === desc.id)?.name || 'Empresa',
      body: companyBody(desc.id, desc.month)
    };
    if (desc.type === 'comparison') return {
      title: 'O que explica a comparação',
      body: comparisonBody(desc)
    };
    if (desc.type === 'group') return {
      title: desc.title,
      body: <><div className="modal-total"><small>{desc.rows.length} registros · composição</small><strong>{money(sum(desc.rows))}</strong></div>{ledger(desc.rows)}</>
    };
    if (desc.type === 'review') {
      const issue = statusReview.find(g => g.key === desc.key);
      return {
        title: issue.title,
        body: <><p className="muted">{issue.note}</p><p>{issue.rows.length} registros identificados. Clique no evento para conferir os campos disponíveis.</p>{ledger(issue.rows)}<p className="footnote">Registros de conferência não são somados automaticamente como valores confirmados.</p></>
      };
    }
    if (desc.type === 'expense') {
      const expense = model.expenses.find(e => e.id === (desc.expenseId || desc.id));
      const event = model.all.rows.find(r => r.id === expense?.event_id);
      return {
        title: expense?.title || expense?.category || 'Despesa',
        body: expense ? <><div className="modal-total"><small>Despesa registrada</small><strong>{money(expense.amount)}</strong></div><dl><div><dt>Data</dt><dd>{dateLabel(expense.expense_date)}</dd></div><div><dt>Categoria</dt><dd>{expense.category || 'Não informada'}</dd></div><div><dt>Empresa / evento</dt><dd>{event ? event.companyName + ' · ' + event.event.title : 'Sem evento vinculado'}</dd></div></dl>{event && <button className="action" onClick={() => open({
            type: 'event',
            id: event.id
          })}>Abrir evento vinculado ↗</button>}</> : <p className="empty">Despesa não encontrada na sua conta.</p>
      };
    }
    if (desc.type === 'expensesGroup') return {
      title: desc.title,
      body: ledger(desc.rows, 'expense')
    };
    if (desc.type === 'workGroup') {
      const r = model.all.rows.find(r => r.id === desc.id);
      const works = model.workByEvent[desc.id] || [];
      return {
        title: 'Registros de trabalho · ' + r?.companyName,
        body: <><p className="muted">Diárias cadastradas. Estes valores representam trabalho, não depósitos.</p>{works.length ? works.map((w, i) => <div className="ledger-row static-row" key={w.id || i}><span><b>{dateLabel(w.date || w.work_date)}</b><small>{Number(w.total_hours ?? w.hours_worked) || 0} h · {w.origem === 'estimada' ? 'registro estimado' : 'registro de trabalho'}</small></span><strong>{w.daily_cache === null || w.daily_cache === undefined ? 'Valor não informado' : money(w.daily_cache)}</strong></div>) : <p className="empty">Sem diárias cadastradas. O cachê fechado permanece no total do evento.</p>}</>
      };
    }
    if (desc.type === 'day') {
      const day = md.calendarDays.find(day => day.date === desc.date);
      const received = desc.mode === 'received';
      return {
        title: (received ? 'Recebimentos' : 'Trabalho') + ' · ' + dateLabel(desc.date),
        body: <><div className="modal-total"><small>{received ? 'Pagamentos cadastrados neste dia' : 'Diárias registradas neste dia'}</small><strong>{money(received ? day?.received : day?.earned)}</strong></div>{received ? ledger(day?.receipts || [], 'receipt') : day?.works.length ? day.works.map((w, i) => <button className="ledger-row" key={i} onClick={() => open({
            type: 'event',
            id: w.event.id
          })}><span><b>{w.event.title}</b><small>{w.estimated ? 'Diária estimada · conferir' : 'Diária registrada'}</small></span><small>{Number(w.work?.total_hours ?? w.work?.hours_worked) || 0} h registradas</small><strong>{money(w.amount)} ↗</strong></button>) : <p className="empty">Sem registros neste dia. Cachês fechados não foram divididos artificialmente.</p>}</>
      };
    }
    if (desc.type === 'future') {
      const rows = model.futureRows(desc.month, desc.kind);
      const label = desc.kind === 'revenue' ? 'Faturamento previsto' : desc.kind === 'cash' ? 'Recebimentos com data informada' : desc.kind === 'reference' ? 'Cenário de entrada · +10 dias' : 'Pagamento sem data definida';
      return {
        title: label + ' · ' + monthLabel(desc.month),
        body: <><p className="muted">{desc.kind === 'revenue' ? 'Eventos contados uma única vez, no mês do encerramento.' : desc.kind === 'cash' ? 'Somente vencimentos cadastrados; não são depósitos confirmados.' : desc.kind === 'reference' ? 'Estimativa de entrada dez dias após o fim. Não altera os dados nem entra no recebido.' : 'Eventos deste mês de encerramento que ainda não têm prazo de pagamento informado.'}</p><div className="modal-total"><small>Valores cadastrados · previsão</small><strong>{money(sum(rows.filter(model.hasValue)))}</strong></div>{ledger(rows)}{rows.some(r => !model.hasValue(r)) && <p className="badge warning">Existem eventos com valor a definir.</p>}</>
      };
    }
    return {
      title: 'Consulta',
      body: <p className="empty">Sem registros.</p>
    };
  }
  const modal = renderModal(current);
  const compare = model.compare(month, metric, company || null, equivalent);
  const companyCards = model.clients.filter(c => c.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).filter(c => {
    const rows = model.dashboard(month, c.id).rows;
    if (companyFilter === 'Pagos') return rows.some(r => r.paid && r.receivedDate?.startsWith(month));
    if (companyFilter === 'Pendentes') return rows.some(r => r.stage === 'completed' && !r.paid);
    if (companyFilter === 'Próximos') return rows.some(r => r.stage === 'upcoming');
    if (companyFilter === 'Em andamento') return rows.some(r => r.stage === 'ongoing');
    if (companyFilter === 'Em atraso') return rows.some(r => r.overdue);
    if (companyFilter === 'Sem vencimento') return rows.some(r => r.stage === 'completed' && !r.paid && !r.dueDate);
    return true;
  }).map(c => ({
    c,
    data: model.metric(month, metric, c.id)
  })).sort((a, b) => b.data.total - a.data.total);
  const futureMonths = Array.from({
    length: 6
  }, (_, i) => shiftMonth(today.slice(0, 7), i));
  const slot = extra => !visible ? extra ? <p className="empty">Valores complementares ocultos.</p> : null : typeof extra === 'function' ? extra({
    currentDate: new Date(month + '-01T12:00:00'),
    monthEvents: d.billedRows.map(r => r.event),
    monthExpenses: d.monthExpenses,
    dashboard: d
  }) : extra;
  function charge(row) {
    const message = buildChargeMessage({
      clientName: row.companyName,
      events: [{
        title: row.event.title,
        start_date: row.startDate,
        amount: row.amount
      }],
      totalAmount: row.amount
    });
    if (!openWhatsAppCharge(row.client?.phone, message)) appToast.info('Cadastre o WhatsApp do cliente para cobrar por aqui.');
  }
  return <><div className="finance-explorer">  <section className="heading-row"><div><p className="eyebrow">CADA VALOR TEM UMA ORIGEM</p><h1>DINHEIRO</h1><p className="muted">Toque nas caixas para abrir a composição.</p></div><div className="month-control"><button onClick={() => setMonth(m => shiftMonth(m, -1))} aria-label="Mês anterior">‹</button><span>{monthLabel(month)}</span><button onClick={() => setMonth(m => shiftMonth(m, 1))} aria-label="Próximo mês">›</button></div></section>
  {onExportPdf && <button className="action" onClick={() => onExportPdf(month)}>Exportar PDF</button>}
  {d.warnings.length > 0 && <button className="review-strip" onClick={() => setTab('review')}><span><b>Dados que precisam de conferência</b><small>Abra a conferência para ver estimativas, dados ausentes e valores antigos.</small></span><span>↗</span></button>}
  <nav role="tablist" aria-label="Visões financeiras" className="tabs">{tabs.map(([key, label]) => <button role="tab" aria-selected={tab === key} key={key} onClick={() => setTab(key)}>{label}</button>)}</nav>
  <section role="tabpanel" aria-label={tabs.find(t => t[0] === tab)[1]} className="tab-body">
  {tab === 'month' && <>
   {card('Entrou no mês', d.totals.received, () => open({
            type: 'metric',
            metric: 'received'
          }), !d.receiptRows.length ? 'Sem recebimentos cadastrados neste recorte.' : d.receiptRows.some(r => r.receivedDateEstimated) ? 'Inclui datas estimadas · veja a composição.' : 'Valor informado no recebimento, pela data do depósito.', 'hero', 'finance-received')}
   <div className="grid three">{metricCard('revenue', d.totals.revenue, 'Eventos encerrados neste mês')}{metricCard('pending', pendingMonth, 'Somente trabalhos encerrados no mês', 'pink-card')}{metricCard('expenses', d.totals.expenses, 'Despesas registradas na sua conta')}</div>
   <div className="grid two"><section className="panel"><div className="panel-heading"><h2>DE ONDE VEIO</h2><button className="text-btn" onClick={() => open({
                  type: 'metric',
                  metric: 'received'
                })}>Ver pagamentos ↗</button></div>{d.receiptRows.length ? Object.values(d.receiptRows.reduce((map, r) => {
                (map[r.companyKey] ??= {
                  name: r.companyName,
                  id: r.companyKey,
                  rows: []
                }).rows.push(r);
                return map;
              }, {})).sort((a, b) => sum(b.rows, r => r.receivedAmount) - sum(a.rows, r => r.receivedAmount)).map(c => <button className="ledger-row" key={c.id} onClick={() => open({
                type: 'metric',
                metric: 'received',
                company: c.id
              })}><span><b>{c.name}</b><small>{c.rows.length} pagamentos no recorte</small></span><strong>{money(sum(c.rows, r => r.receivedAmount))} ↗</strong></button>) : <p className="empty">Sem recebimentos registrados no recorte.</p>}</section><section className="panel"><h2>O QUE EXPLICA O MÊS</h2><div className="stack">{card('Eventos encerrados', String(d.billedRows.length), () => open({
                  type: 'group',
                  title: 'Eventos encerrados · ' + monthLabel(month),
                  rows: d.billedRows
                }), 'Abrir os trabalhos deste mês')}{card('Variação do recebido', model.compare(month, 'received', null, true).delta, () => open({
                  type: 'comparison',
                  metric: 'received',
                  equivalent: true
                }), 'Comparação equivalente com o mês anterior')}</div></section></div>
   {metricCard('cash', d.totals.cash, 'Entradas menos despesas registradas; não é saldo bancário nem lucro contábil.')}
   <div className="grid two">{metricCard('ongoing', d.totals.ongoing, 'Agenda do período · valor previsto')}{metricCard('upcoming', d.totals.upcoming, 'Agenda do período · não somar meses sobrepostos')}</div>
   <button className="review-strip" onClick={() => setTab('review')}><span><b>Conferir a qualidade do histórico</b><small>Datas a revisar, valores antigos e dados não informados.</small></span><span>↗</span></button>
  </>}
  {tab === 'companies' && <>
   <div className="section-intro"><h2>EMPRESAS EM FOCO</h2><p>Cada empresa abre seus valores, os eventos e a evolução mensal.</p></div>
   <div className="filters"><input aria-label="Buscar empresa" placeholder="Buscar empresa" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Indicador das empresas" value={metric} onChange={e => setMetric(e.target.value)}><option value="received">Recebido no mês</option><option value="revenue">Faturamento do mês</option><option value="expenses">Despesas vinculadas</option></select></div>
   <div className="filters" aria-label="Filtrar empresas">{['Todas', 'Pagos', 'Pendentes', 'Próximos', 'Em andamento', 'Em atraso', 'Sem vencimento'].map(filter => <button type="button" className="action" key={filter} aria-pressed={companyFilter === filter} onClick={() => setCompanyFilter(filter)}>{filter}</button>)}</div>
   <div className="grid three">{companyCards.map(({
              c,
              data
            }) => card(c.name, data.total, () => open({
              type: 'company',
              id: c.id
            }), data.rows.length ? data.rows.length + ' registros · abrir empresa' : 'Sem registros deste indicador no mês', '', 'finance-company-' + c.id))}</div>
  </>}
  {tab === 'calendar' && <>
   <div className="section-intro"><h2>CADA DIA CONTA</h2><p>O dia do trabalho e o dia do depósito têm informações diferentes.</p></div><div className="segmented">{[['received', 'Recebimentos'], ['work', 'Trabalho']].map(([key, label]) => <button aria-pressed={calendarMode === key} onClick={() => setCalendarMode(key)} key={key}>{label}</button>)}</div>
   <section className="panel"><div className="calendar">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((v, i) => <span className="weekday" key={'w' + i}>{v}</span>)}{Array.from({
                length: new Date(month + '-01T12:00:00Z').getUTCDay()
              }, (_, i) => <span key={'blank' + i} />)}{d.calendarDays.map(day => {
                const count = calendarMode === 'received' ? day.receipts.length : day.works.length;
                return <button key={day.date} aria-label={'Detalhar ' + dateLabel(day.date) + ' · ' + (calendarMode === 'received' ? 'recebimentos' : 'trabalho')} data-date={day.date} data-testid={'finance-calendar-day-' + day.date} className={'day ' + (count ? 'has-data' : '')} onClick={() => open({
                  type: 'day',
                  date: day.date,
                  mode: calendarMode
                })}><b>{Number(day.date.slice(-2))}</b><small>{count ? count + ' registros' : '—'}</small></button>;
              })}</div><p className="footnote">Todos os dias abrem detalhes. Sem registro não comprova ganho zero. Cachês fechados não são divididos entre dias.</p></section>
   <section className="panel" data-testid="finance-daily-chart"><h2>{calendarMode === 'received' ? 'ENTRADAS POR DIA' : 'Ganhos diários registrados'}</h2><div className="bars">{d.calendarDays.filter(day => calendarMode === 'received' ? day.receipts.length : day.works.length).map(day => <button className="bar-row" key={day.date} onClick={() => open({
                type: 'day',
                date: day.date,
                mode: calendarMode
              })}><span>{dateLabel(day.date)}<b>{money(calendarMode === 'received' ? day.received : day.earned)} ↗</b></span><i><em style={{
                    width: visible ? Math.max(0, (calendarMode === 'received' ? day.received : day.earned) / Math.max(1, ...d.calendarDays.map(x => calendarMode === 'received' ? x.received : x.earned)) * 100) + '%' : '0%'
                  }} /></i></button>)}</div></section>
  </>}
  {tab === 'compare' && <>
   <div className="section-intro"><h2>UM MÊS EXPLICA O OUTRO</h2><p>Compare o mesmo indicador e abra os registros que causaram a diferença.</p></div>
   <div className="filters"><select aria-label="Indicador da comparação" value={metric} onChange={e => setMetric(e.target.value)}><option value="received">Recebido</option><option value="revenue">Faturamento</option><option value="expenses">Despesas</option></select><select aria-label="Empresa da comparação" value={company} onChange={e => setCompany(e.target.value)}><option value="">Todas as empresas</option>{model.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Recorte da comparação" value={equivalent ? 'equivalent' : 'full'} onChange={e => setEquivalent(e.target.value === 'equivalent')}><option value="equivalent">Mesmos dias · mês atual</option><option value="full">Meses completos</option></select></div>
   <div className="grid three">{card(monthLabel(month), compare.current.total, () => open({
              type: 'comparison',
              metric,
              company,
              equivalent
            }), 'Até ' + dateLabel(compare.currentEnd))}{card(monthLabel(compare.previous), compare.prior.total, () => open({
              type: 'comparison',
              metric,
              company,
              equivalent
            }), 'Até ' + dateLabel(compare.previousEnd))}{card('Diferença entre os períodos', compare.delta, () => open({
              type: 'comparison',
              metric,
              company,
              equivalent
            }), compare.percent === null ? 'Sem base para percentual' : visible ? compare.percent.toFixed(1) + '% no indicador' : 'Variação oculta')}</div>
   <section className="panel"><h2>EVOLUÇÃO MENSAL · {metric === 'received' ? 'RECEBIDO' : metric === 'revenue' ? 'FATURAMENTO' : 'DESPESAS'}</h2>{historyBars(company || null)}<p className="footnote">Barras mostram o mês inteiro cadastrado. A comparação acima respeita o recorte selecionado.</p></section>
   <section className="panel"><h2>CONTRIBUIÇÃO DAS EMPRESAS</h2>{model.clients.map(c => ({
              c,
              delta: model.compare(month, metric, c.id, equivalent).delta
            })).filter(c => c.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).map(({
              c,
              delta
            }) => <button className="ledger-row" key={c.id} onClick={() => open({
              type: 'comparison',
              metric,
              company: c.id,
              equivalent
            })}><span><b>{c.name}</b><small>Abrir os dois períodos desta empresa</small></span><strong>{money(delta)} ↗</strong></button>)}{!model.clients.some(c => model.compare(month, metric, c.id, equivalent).delta !== 0) && <p className="empty">Sem diferença nos registros dos períodos.</p>}</section>
  </>}
  {tab === 'future' && <>
   <div className="section-intro"><h2>OS PRÓXIMOS MESES</h2><p>Uma agenda de trabalho não comprova o mês do pagamento. Cada valor abaixo abre sua origem.</p></div>
   {futureMonths.map(m => <section className="panel" key={m}><h2>{monthLabel(m).toLocaleUpperCase('pt-BR')}</h2><div className="grid three">{card('Faturamento previsto', sum(model.futureRows(m, 'revenue').filter(model.hasValue)), () => open({
                type: 'future',
                month: m,
                kind: 'revenue'
              }), 'Pelo encerramento · cada evento uma vez')}{card('Recebimento com data', sum(model.futureRows(m, 'cash').filter(model.hasValue)), () => open({
                type: 'future',
                month: m,
                kind: 'cash'
              }), 'Somente vencimentos cadastrados')}{card('Sem data de pagamento', sum(model.futureRows(m, 'noDate').filter(model.hasValue)), () => open({
                type: 'future',
                month: m,
                kind: 'noDate'
              }), 'Prazo de recebimento a definir', 'pink-card')}</div><button className="text-btn" onClick={() => open({
              type: 'future',
              month: m,
              kind: 'reference'
            })}>Explorar cenário de entrada em {monthLabel(m)} com +10 dias ↗</button></section>)}
  </>}
  {tab === 'review' && <>
   <div className="section-intro"><h2>CONFIANÇA EM CADA NÚMERO</h2><p>Abra cada grupo para entender o dado disponível, o que falta e seu efeito nos totais.</p></div><div className="grid two">{statusReview.map(group => card(group.title, String(group.rows.length) + ' registros', () => open({
              type: 'review',
              key: group.key
            }), group.note, group.key === 'missing' ? 'pink-card' : ''))}</div>
   <section className="panel"><h2>FONTES QUE NÃO SE CONFUNDEM</h2><dl><div><dt>Valor recebido</dt><dd>O valor informado pelo usuário em “Recebi”.</dd></div><div><dt>Data do depósito</dt><dd>Dia informado ou estimativa identificada; diferente da data da baixa.</dd></div><div><dt>Faturamento</dt><dd>Mês do encerramento do evento.</dd></div><div><dt>Entrada futura</dt><dd>Data de vencimento cadastrada; cenário +10 fica separado.</dd></div><div><dt>Aviso de pendência</dt><dd>A partir do décimo dia após o fim, se ainda não pago.</dd></div></dl></section>
  </>}
  {(tab === 'fiscal' || tab === 'analise') && <FinanceLegacyPanels activeTab={tab} dashboard={d} currentDate={new Date(month + '-01T12:00:00')} money={money} events={events} fiscalExtra={fiscalExtra} analiseExtra={analiseExtra} slot={slot} openDetail={key => open({
          type: 'metric',
          metric: key
        })} isVisible={visible} />}
  {tab === 'companies' && receberExtra && slot(receberExtra)}
  </section><footer className="page-footer">Valores da sua conta · dados estimados e valores antigos ficam identificados.</footer>
 </div>
 <Dialog open={stack.length > 0} onOpenChange={value => {
      if (!value) close();
    }}>
 <DialogContent className="finance-explorer finance-explorer-dialog !flex !flex-col !gap-0 !p-0 !max-w-[740px] !w-[calc(100%-24px)] !overflow-hidden" hideDefaultClose aria-describedby={undefined} onCloseAutoFocus={e => {
        e.preventDefault();
        trigger.current?.focus();
      }} onEscapeKeyDown={e => {
        e.preventDefault();
        back();
      }} data-testid="finance-metric-dialog">
 <header className="dialog-heading"><div>{stack.length > 1 && <button className="text-btn" onClick={back}>‹ Voltar à composição</button>}<small>DADOS DA SUA CONTA · {monthLabel(current?.month || month)}</small><DialogTitle>{modal.title}</DialogTitle></div><button className="close" aria-label="Fechar detalhes" onClick={close}>×</button></header><div className="dialog-scroll bp-modal-scroll" key={stack.length + ':' + current?.id + ':' + current?.type}>{modal.body}</div>
 </DialogContent></Dialog>
 </>;
}
