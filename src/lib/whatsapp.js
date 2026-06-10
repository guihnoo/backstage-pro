/**
 * Utilitários WhatsApp — cobrança, contato e relatório de evento (Brasil).
 */

import { getEventCacheAmount } from '@/lib/eventFinance';

export function formatWhatsAppNumber(phone) {
  if (!phone) return null;
  const clean = String(phone).replace(/\D/g, '');
  if (!clean) return null;
  return clean.length > 11 ? clean : `55${clean}`;
}

export function formatBRL(value) {
  const n = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n);
}

export function buildChargeMessage({ clientName, events, totalAmount }) {
  const name = clientName || 'Cliente';
  const total = formatBRL(totalAmount);

  if (!events?.length) {
    return `Olá ${name}, passando para lembrar sobre um pagamento pendente no valor de ${total}. Qualquer dúvida, estou à disposição.`;
  }

  if (events.length === 1) {
    const ev = events[0];
    const show = ev.title || 'show';
    const date = ev.start_date
      ? new Date(ev.start_date + 'T12:00:00').toLocaleDateString('pt-BR')
      : '';
    const datePart = date ? ` em ${date}` : '';
    const amount = formatBRL(ev.amount);
    return `Olá ${name}, passando para lembrar sobre o pagamento do show "${show}"${datePart}, no valor de ${amount}. Qualquer dúvida, estou à disposição.`;
  }

  const lines = events
    .slice(0, 5)
    .map((ev) => {
      const date = ev.start_date
        ? new Date(ev.start_date + 'T12:00:00').toLocaleDateString('pt-BR')
        : '—';
      return `• ${ev.title || 'Show'} (${date}): ${formatBRL(ev.amount)}`;
    })
    .join('\n');

  const extra = events.length > 5 ? `\n• ... e mais ${events.length - 5} evento(s)` : '';

  return `Olá ${name}, passando para lembrar sobre os pagamentos pendentes:\n\n${lines}${extra}\n\nTotal: ${total}\n\nQualquer dúvida, estou à disposição.`;
}

export function openWhatsAppCharge(phone, message) {
  const number = formatWhatsAppNumber(phone);
  if (!number) return false;
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Gera um relatório final do evento para enviar ao cliente.
 * Inclui cachê, horas trabalhadas e despesas (reembolsáveis destacadas).
 */
export function buildEventReport({ event, client, work = [], expenses = [] }) {
  const clientName = client?.name || 'Cliente';
  const eventTitle = event?.title || 'Evento';

  const startDate = event?.start_date
    ? new Date(event.start_date + 'T12:00:00').toLocaleDateString('pt-BR')
    : null;
  const endDate = event?.end_date && event.end_date !== event.start_date
    ? new Date(event.end_date + 'T12:00:00').toLocaleDateString('pt-BR')
    : null;
  const dateLine = endDate ? `${startDate} a ${endDate}` : (startDate || '');

  const totalHours = work.reduce((sum, w) => sum + (w.total_hours || 0), 0);
  const totalEarned = work.reduce((sum, w) => sum + (w.daily_cache || 0), 0);

  const cacheValue = totalEarned > 0 ? totalEarned : getEventCacheAmount(event);

  const reimbursableExpenses = expenses.filter(e => e.is_reimbursable && !e.reimbursed);
  const totalReimbursable = reimbursableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalToReceive = Number(cacheValue) + totalReimbursable;

  const lines = [];

  lines.push(`📋 *RELATÓRIO DO EVENTO*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🎭 *${eventTitle}*`);
  lines.push(`🏢 ${clientName}`);
  if (dateLine) lines.push(`📅 ${dateLine}`);
  if (event?.location) lines.push(`📍 ${event.location}`);

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 *FINANCEIRO*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Cachê: *${formatBRL(cacheValue)}*`);

  if (totalHours > 0) {
    lines.push(`Horas trabalhadas: ${totalHours.toFixed(1)}h`);
  }

  if (expenses.length > 0) {
    lines.push(``);
    lines.push(`🧾 *DESPESAS DO EVENTO*`);

    const categoryLabels = {
      transporte: 'Transporte',
      alimentacao: 'Alimentação',
      hospedagem: 'Hospedagem',
      equipamento: 'Equipamento',
      combustivel: 'Combustível',
      manutencao: 'Manutenção',
      outros: 'Outros',
    };

    for (const exp of expenses) {
      const cat = categoryLabels[exp.category] || exp.category || 'Outros';
      const reimb = exp.is_reimbursable ? ' ✅ reembolsável' : '';
      lines.push(`• ${exp.title || cat} — ${formatBRL(exp.amount)}${reimb}`);
    }

    lines.push(`Total despesas: ${formatBRL(totalExpenses)}`);

    if (totalReimbursable > 0) {
      lines.push(`A reembolsar: *${formatBRL(totalReimbursable)}*`);
    }
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);

  if (totalReimbursable > 0) {
    lines.push(`✅ *TOTAL A RECEBER: ${formatBRL(totalToReceive)}*`);
    lines.push(`_(cachê ${formatBRL(cacheValue)} + reembolso ${formatBRL(totalReimbursable)})_`);
  } else {
    lines.push(`✅ *TOTAL: ${formatBRL(cacheValue)}*`);
  }

  lines.push(``);
  lines.push(`Qualquer dúvida, estou à disposição. 🙏`);

  return lines.join('\n');
}
