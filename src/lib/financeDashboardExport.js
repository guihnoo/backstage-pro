// A exportação recebe o mesmo retrato financeiro exibido na tela.
const money = (value) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const dateLabel = (value) => value ? String(value).slice(0, 10).split('-').reverse().join('/') : 'Não informada';

function table(headers, rows) {
  return '<table><thead><tr>' + headers.map((h) => '<th>' + escapeHtml(h) + '</th>').join('') +
    '</tr></thead><tbody>' + (rows.length ? rows.map((cells) => '<tr>' +
      cells.map((cell) => '<td>' + escapeHtml(cell) + '</td>').join('') + '</tr>').join('') :
      '<tr><td colspan="' + headers.length + '">Nenhum registro neste recorte.</td></tr>') + '</tbody></table>';
}

export function buildFinanceReportHtml(dashboard) {
  const { monthKey, range, totals, billedRows, receiptRows, pendingRows, ongoingRows, upcomingRows, monthExpenses, warnings } = dashboard;
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(range.start + 'T12:00:00Z'));
  const metricRows = [
    ['Faturamento do mês — eventos encerrados', money(totals.revenue)],
    ['Entrou no mês — data real de pagamento', money(totals.received)],
    ['Falta receber de realizados — todos os períodos', money(totals.pending)],
    ['Despesas registradas no mês', money(totals.expenses)],
    ['Resultado de caixa registrado no mês', money(totals.cash)],
    ['Em andamento no período — previsão', money(totals.ongoing)],
    ['Próximos eventos no período — previsão', money(totals.upcoming)],
  ];
  const eventRows = (rows) => rows.map((row) => [
    row.companyName, row.event.title || 'Evento', dateLabel(row.startDate) + ' a ' + dateLabel(row.endDate),
    money(row.amount), row.paid ? 'Pago' : row.overdue ? 'Em atraso' : row.dueDate ? 'A vencer' : 'Sem vencimento',
  ]);
  const eventHeaders = ['Empresa', 'Evento', 'Período do trabalho', 'Valor do evento', 'Pagamento'];
  const warningText = warnings.length ? '<aside><strong>Dados a conferir</strong><ul>' +
    warnings.map((w) => '<li>' + escapeHtml(w.label) + ' (' + escapeHtml(w.count) + ')</li>').join('') + '</ul></aside>' : '';
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<title>Backstage Pro — Financeiro ' + escapeHtml(monthKey) + '</title>' +
    '<style>body{font:14px system-ui,sans-serif;color:#161616;margin:32px;line-height:1.5}h1{font-size:28px;margin-bottom:4px}h2{font-size:19px;margin-top:28px}p{color:#555}table{border-collapse:collapse;width:100%;margin:12px 0;font-size:12px}th,td{padding:9px;text-align:left;border-bottom:1px solid #ddd;vertical-align:top}th{background:#f3f3f3}aside{padding:12px;background:#fff5d1;margin:16px 0}tr{break-inside:avoid}.period{font-size:17px;color:#161616}@media print{body{margin:12mm}h2{break-after:avoid}thead{display:table-header-group}}</style></head><body>' +
    '<h1>Backstage Pro — Financeiro</h1><p class="period">' + escapeHtml(month) + '</p>' +
    '<p>Período: ' + escapeHtml(dateLabel(range.start)) + ' a ' + escapeHtml(dateLabel(range.end)) + '.</p>' +
    '<p>Faturamento pelo mês do encerramento. Recebimentos pela data real do pagamento. Previsões são separadas e não devem ser somadas ao faturamento.</p>' +
    table(['Indicador', 'Valor'], metricRows) +
    '<p>Resultado de caixa considera apenas entradas e despesas registradas; não representa saldo bancário ou lucro contábil.</p>' + warningText +
    '<h2>Eventos que formam o faturamento do mês</h2>' + table(eventHeaders, eventRows(billedRows)) +
    '<h2>Recebimentos do mês</h2>' + table(['Empresa', 'Evento', 'Data do pagamento', 'Recebido'], receiptRows.map((r) => [
      r.companyName, r.event.title || 'Evento', dateLabel(r.receivedDate), money(r.receivedAmount),
    ])) +
    '<h2>Realizados a receber — todos os períodos</h2>' + table(['Empresa', 'Evento', 'Vencimento', 'Valor a receber'], pendingRows.map((r) => [
      r.companyName, r.event.title || 'Evento', dateLabel(r.dueDate), money(r.amount),
    ])) +
    '<h2>Em andamento no período</h2>' + table(eventHeaders, eventRows(ongoingRows)) +
    '<h2>Próximos eventos no período</h2>' + table(eventHeaders, eventRows(upcomingRows)) +
    '<h2>Despesas do mês</h2>' + table(['Data', 'Descrição', 'Valor'], monthExpenses.map((e) => [
      dateLabel(e.expense_date || e.date), e.description || e.title || e.category || 'Despesa', money(e.amount),
    ])) +
    '</body></html>';
}

export function openFinanceReport(dashboard) {
  const report = window.open('', '_blank');
  if (!report) throw new Error('Permita abrir a janela do relatório para salvar o PDF.');
  report.opener = null;
  report.document.open();
  report.document.write(buildFinanceReportHtml(dashboard));
  report.document.close();
  report.focus();
  report.print();
  return report;
}
