/**
 * Utilitários WhatsApp — cobrança e contato (Brasil).
 */

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
