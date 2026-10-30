const sum = (rows) => rows.reduce((total, row) => total + Math.round(Number(row.amount) * 100), 0) / 100;

function eventEntry(row, receipt = false) {
  const recorded = row.event.paid_amount;
  const hasRecorded = recorded !== null && recorded !== undefined && recorded !== '' && Number.isFinite(Number(recorded));
  return {
    id: row.id, event: row.event, title: row.event.title || 'Evento sem título',
    company: row.companyName, amount: receipt ? row.receivedAmount : row.amount,
    startDate: row.startDate, endDate: row.endDate, receivedDate: row.receivedDate,
    receivedDateEstimated: row.receivedDateEstimated, receivedDateEstimateDays: row.receivedDateEstimateDays,
    paid: row.paid, receiptConfirmed: row.paid && row.amountSource !== 'calculated', receivedAmount: row.receivedAmount,
    calculatedAmount: row.calculatedAmount ?? row.amount,
    paymentDifference: row.paid && row.amountSource !== 'calculated' ? (Math.round(row.receivedAmount * 100) - Math.round((row.calculatedAmount ?? row.amount) * 100)) / 100 : null,
    source: receipt
      ? hasRecorded ? 'Valor informado na confirmação do pagamento'
        : row.amountSource === 'actual' ? 'Valor do evento pago · cadastro antigo'
          : 'Valor calculado do evento · recebimento a conferir'
      : row.amountSource === 'payment' ? 'Valor final informado na confirmação do pagamento'
        : row.amountSource === 'actual' ? 'Valor final registrado no evento pago'
          : 'Valor do trabalho cadastrado, considerando cachê e registros de diárias',
    needsReview: row.paid && !hasRecorded,
  };
}

/** Only composes rows from the dashboard snapshot; no fetching or writes. */
export function buildFinanceMetricDetails(dashboard, key) {
  if (!['revenue', 'received', 'pending', 'expenses', 'cash', 'ongoing', 'upcoming'].includes(key)) return null;
  const rowsById = new Map(dashboard.rows.map((row) => [String(row.id), row]));
  const receipts = dashboard.receiptRows.map((row) => eventEntry(row, true));
  const unverified = (dashboard.unverifiedReceiptRows || []).map((row) => eventEntry(row, true));
  const billed = dashboard.billedRows.map((row) => eventEntry(row));
  const pending = dashboard.billedRows.filter((row) => !row.paid).map((row) => eventEntry(row));
  const expenses = dashboard.monthExpenses.map((expense, index) => {
    const linked = rowsById.get(String(expense.event_id));
    return {
      id: expense.id || 'expense-' + index, event: linked?.event,
      title: expense.description || expense.title || expense.category || 'Despesa',
      company: linked?.companyName || 'Despesa sem evento vinculado',
      amount: Number.isFinite(Number(expense.amount)) ? Number(expense.amount) : 0, date: expense.expense_date || expense.date,
      source: 'Despesa registrada na data informada',
    };
  });
  const section = (title, rows, kind = 'event') => ({ title, rows, kind, total: sum(rows) });
  const options = {
    revenue: {
      title: 'Faturamento do mês',
      description: 'Somente eventos encerrados no mês selecionado. A data de recebimento não muda o mês do faturamento.',
      sections: [section('Eventos que compõem o faturamento', billed)],
    },
    received: {
      title: 'Entrou no mês',
      description: 'Somente pagamentos com data de recebimento neste mês. Inclui eventos de outros meses pagos agora.',
      sections: [
        section('Recebido de eventos encerrados neste mês', receipts.filter((row) => row.endDate?.startsWith(dashboard.monthKey)), 'receipt'),
        section('Recebido de eventos de outros meses', receipts.filter((row) => !row.endDate?.startsWith(dashboard.monthKey)), 'receipt'),
        ...(unverified.length ? [{ ...section('Pagamentos sem valor final · não somados', unverified, 'receipt'), excluded: true }] : []),
      ],
    },
    pending: {
      title: 'Falta receber deste mês',
      description: 'Somente eventos encerrados neste mês e ainda não marcados como pagos. O histórico completo continua na aba Empresas.',
      sections: [section('Eventos do mês ainda não pagos', pending)],
    },
    expenses: {
      title: 'Despesas do mês',
      description: 'Somente despesas registradas no mês selecionado, até a data atual.',
      sections: [section('De onde vieram as despesas', expenses, 'expense')],
    },
    cash: {
      title: 'Resultado de caixa do mês',
      description: 'Recebimentos deste mês menos despesas deste mês. Não representa saldo bancário nem lucro contábil.',
      sections: [section('Entradas registradas', receipts, 'receipt'), section('Despesas a descontar', expenses, 'expense'), ...(unverified.length ? [{ ...section('Pagamentos sem valor final · não somados', unverified, 'receipt'), excluded: true }] : [])],
    },
    ongoing: {
      title: 'Em andamento',
      description: 'Previsões de eventos em andamento que passam pelo mês selecionado. Não são recebimentos confirmados.',
      sections: [section('Eventos em andamento', dashboard.ongoingRows.map((row) => eventEntry(row)))],
    },
    upcoming: {
      title: 'Próximos eventos',
      description: 'Previsões de eventos futuros que passam pelo mês selecionado. Não integram o faturamento realizado.',
      sections: [section('Eventos previstos', dashboard.upcomingRows.map((row) => eventEntry(row)))],
    },
  };
  const detail = options[key];
  if (!detail) return null;
  return {
    ...detail, monthKey: dashboard.monthKey,
    total: key === 'cash' ? (Math.round(sum(receipts) * 100) - Math.round(sum(expenses) * 100)) / 100
      : Math.round(detail.sections.filter((item) => !item.excluded).reduce((total, item) => total + Math.round(item.total * 100), 0)) / 100,
  };
}
