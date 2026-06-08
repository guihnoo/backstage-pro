import { format, parseISO } from 'date-fns';
import { getEventStatus, getEventStatusLabel } from '@/components/utils/dateUtils';
import { getEventCacheAmount } from '@/lib/eventFinance';

function periodBounds(period) {
  const start = period?.start ?? period?.from ?? null;
  const end = period?.end ?? period?.to ?? null;
  return { start, end };
}

function periodLabel(period) {
  const { start, end } = periodBounds(period);
  if (!start || !end) return 'Todo o período';
  try {
    return `${format(start, 'dd/MM/yyyy')} – ${format(end, 'dd/MM/yyyy')}`;
  } catch {
    return 'Período selecionado';
  }
}

function clientName(clients, clientId) {
  if (!clientId) return '';
  return clients.find((c) => c.id === clientId)?.name || '';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value) {
  if (!value) return '';
  try {
    return format(parseISO(value), 'dd/MM/yyyy');
  } catch {
    return String(value);
  }
}

function escapeCsvCell(value) {
  const text = value == null ? '' : String(value);
  if (/[;"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map(escapeCsvCell).join(';')).join('\r\n');
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildSummaryRows(data) {
  const { events = [], work = [], expenses = [], clients = [] } = data;
  const realized = events
    .filter((e) => e.payment_status === 'paid')
    .reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
  const receivable = events
    .filter((e) => getEventStatus(e) === 'completed' && e.payment_status === 'unpaid')
    .reduce((sum, e) => sum + getEventCacheAmount(e), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalHours = work.reduce((sum, w) => sum + Number(w.total_hours || w.hours_worked || 0), 0);

  return [
    ['Métrica', 'Valor'],
    ['Faturamento realizado', formatMoney(realized)],
    ['A receber (estimado)', formatMoney(receivable)],
    ['Despesas', formatMoney(totalExpenses)],
    ['Lucro líquido (estimado)', formatMoney(realized + receivable - totalExpenses)],
    ['Horas trabalhadas', String(totalHours)],
    ['Eventos no período', String(events.length)],
    ['Clientes cadastrados', String(clients.length)],
  ];
}

function buildEventRows(data) {
  const rows = [
    ['Evento', 'Cliente', 'Início', 'Fim', 'Status', 'Pagamento', 'Valor pago', 'Cachê'],
  ];
  for (const event of data.events || []) {
    rows.push([
      event.title || '',
      clientName(data.clients, event.client_id),
      formatDate(event.start_date),
      formatDate(event.end_date),
      getEventStatusLabel(event),
      event.payment_status || '',
      formatMoney(event.paid_amount),
      formatMoney(getEventCacheAmount(event)),
    ]);
  }
  return rows;
}

function buildWorkRows(data) {
  const rows = [['Data', 'Evento', 'Entrada', 'Saída', 'Horas', 'Cachê', 'Status']];
  const eventMap = Object.fromEntries((data.events || []).map((e) => [e.id, e.title]));
  for (const work of data.work || []) {
    rows.push([
      formatDate(work.work_date || work.date),
      eventMap[work.event_id] || work.event_id || '',
      work.entry_time || '',
      work.exit_time || '',
      String(work.total_hours || work.hours_worked || 0),
      formatMoney(work.daily_cache),
      work.status || '',
    ]);
  }
  return rows;
}

function buildExpenseRows(data) {
  const rows = [['Data', 'Descrição', 'Categoria', 'Valor', 'Evento']];
  const eventMap = Object.fromEntries((data.events || []).map((e) => [e.id, e.title]));
  for (const expense of data.expenses || []) {
    rows.push([
      formatDate(expense.date),
      expense.description || expense.title || '',
      expense.category || '',
      formatMoney(expense.amount),
      eventMap[expense.event_id] || '',
    ]);
  }
  return rows;
}

export function exportReportCsv(data, period) {
  const label = periodLabel(period);
  const sections = [
    ['Backstage Pro — Relatório', label],
    [],
    ['=== RESUMO ==='],
    ...buildSummaryRows(data),
    [],
    ['=== EVENTOS ==='],
    ...buildEventRows(data),
    [],
    ['=== HORAS ==='],
    ...buildWorkRows(data),
    [],
    ['=== DESPESAS ==='],
    ...buildExpenseRows(data),
  ];

  const csv = '\uFEFF' + rowsToCsv(sections);
  const safeLabel = label.replace(/[^\d]/g, '').slice(0, 16) || 'periodo';
  downloadBlob(`backstage-relatorio-${safeLabel}.csv`, csv, 'text/csv;charset=utf-8');
}

export function exportReportPdf(data, period) {
  const label = periodLabel(period);
  const summary = buildSummaryRows(data);
  const events = buildEventRows(data);
  const work = buildWorkRows(data);
  const expenses = buildExpenseRows(data);

  const table = (title, rows) => {
    if (rows.length <= 1) {
      return `<h2>${title}</h2><p>Nenhum registro no período.</p>`;
    }
    const [header, ...body] = rows;
    return `
      <h2>${title}</h2>
      <table>
        <thead><tr>${header.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${body.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
  };

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Backstage Pro — Relatório</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .meta { color: #555; margin-bottom: 20px; }
    h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f5f5f5; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Backstage Pro — Relatório Financeiro</h1>
  <p class="meta">Período: ${label} · Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
  ${table('Resumo', summary)}
  ${table('Eventos', events)}
  ${table('Horas trabalhadas', work)}
  ${table('Despesas', expenses)}
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    throw new Error('Permita pop-ups para exportar o PDF.');
  }
  win.document.write(html);
  win.document.close();
}
