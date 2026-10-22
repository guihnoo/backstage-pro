/**
 * Utilitários WhatsApp — cobrança, contato e relatório de evento (Brasil).
 */

import { buildEventClosing } from './eventClosing';

export function formatWhatsAppNumber(phone) {
  if (!phone) return null;
  const clean = String(phone).replace(/\D/g, '');
  if (!clean) return null;
  return clean.length > 11 ? clean : `55${clean}`;
}

export function formatBRL(value) {
  // O banco pode devolver valores como texto ("150.50"); converte antes de formatar.
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? parsed : 0;
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
 * Gera uma proposta técnica para enviar ao cliente ANTES do show.
 */
export function buildProposalMessage({
  clientName,
  techName,
  eventTitle,
  startDate,
  endDate,
  location,
  locationCity,
  amount,
  pixKey,
  pixKeyType,
  notes,
}) {
  const name = clientName || 'Cliente';
  const tech = techName || 'Técnico';
  const valor = formatBRL(amount || 0);

  const fmt = (d) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;

  const dataInicio = fmt(startDate);
  const dataFim = endDate && endDate !== startDate ? fmt(endDate) : null;
  const dataPart = dataFim ? `${dataInicio} a ${dataFim}` : dataInicio;

  const lines = [
    `Olá ${name}! 👋`,
    ``,
    `Segue minha proposta técnica para o evento:`,
    ``,
    `📋 *PROPOSTA TÉCNICA*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🎭 *${eventTitle || 'Evento'}*`,
    dataPart ? `📅 ${dataPart}` : null,
    location ? `📍 ${location}${locationCity ? ` — ${locationCity}` : ''}` : locationCity ? `📍 ${locationCity}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *CACHÊ: ${valor}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
  ].filter(l => l !== null);

  if (pixKey) {
    lines.push(``, `🔑 Pagamento via PIX:`);
    lines.push(`${pixKeyType || 'Chave PIX'}: *${pixKey}*`);
  }

  if (notes) {
    lines.push(``, `📝 *Observações:*`, notes);
  }

  lines.push(
    ``,
    `_Proposta válida por 7 dias._`,
    ``,
    `Qualquer dúvida estou à disposição! 😊`,
    `— ${tech}`,
  );

  return lines.join('\n');
}

/**
 * Gera um relatório final do evento para enviar ao cliente.
 * Inclui cachê, horas trabalhadas e despesas (reembolsáveis destacadas).
 */
export function buildEventReport({
  event,
  client,
  work = [],
  expenses = [],
  pixKey = '',
  pixKeyType = 'Chave PIX',
  pixPayloadStr = '',
  providerName = '',
}) {
  const clientName = client?.name || 'Cliente';
  const eventTitle = event?.title || 'Evento';
  const nfeNum = event?.nfe_numero || event?.nf_number || event?.nfe_analise?.numero_nota || '';

  const startDate = event?.start_date
    ? new Date(event.start_date + 'T12:00:00').toLocaleDateString('pt-BR')
    : null;
  const endDate = event?.end_date && event.end_date !== event.start_date
    ? new Date(event.end_date + 'T12:00:00').toLocaleDateString('pt-BR')
    : null;
  const dateLine = endDate ? `${startDate} a ${endDate}` : (startDate || '');

  // Fechamento do evento inteiro: todos os dias, dia sem horas entra com a diária
  // (antes um único dia lançado substituía as outras diárias — auditoria 15/10).
  const closing = buildEventClosing(event, work, expenses);
  const totalHours = closing.totalHoras;
  const cacheValue = closing.totalServicos;

  // Mesmo cálculo do PDF (eventClosing): só reembolso ainda não pago.
  const totalReimbursable = closing.totalReembolsos;
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalToReceive = closing.total;

  const lines = [];

  lines.push(`📋 *RELATÓRIO DO EVENTO*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🎭 *${eventTitle}*`);
  lines.push(`🏢 ${clientName}`);
  if (dateLine) lines.push(`📅 ${dateLine}`);
  if (event?.location) lines.push(`📍 ${event.location}`);
  if (nfeNum) lines.push(`📄 NF-e / NFS-e: *Nº ${nfeNum}*`);

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 *FINANCEIRO*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Cachê: *${formatBRL(cacheValue)}*`);

  if (totalHours > 0) {
    lines.push(`Horas trabalhadas: ${totalHours.toFixed(1)}h`);
  }
  if (closing.totalHorasExtras > 0) {
    lines.push(`Horas extras: ${closing.totalHorasExtrasQtd}h (${formatBRL(closing.totalHorasExtras)}, já no cachê)`);
  }
  if (closing.rows.length > 1 || closing.semHoras.length > 0) {
    lines.push(``);
    lines.push(`*Dias do evento*`);
    for (const r of closing.rows) {
      const dia = `${r.date.slice(8, 10)}/${r.date.slice(5, 7)}`;
      if (r.status === 'sem_horas') {
        lines.push(`• ${dia} — diária ${formatBRL(r.subtotal)} (sem horas lançadas)`);
      } else {
        const horario = r.entry && r.exit ? `${r.entry}–${r.exit} · ` : '';
        const extra = r.overtimeHours > 0 ? ` (${r.overtimeHours}h extra)` : '';
        lines.push(`• ${dia} — ${horario}${r.totalHours}h${extra} · ${formatBRL(r.subtotal)}`);
      }
    }
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
      quilometragem: 'Quilometragem',
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

  if (pixKey) {
    lines.push(``);
    lines.push(`🔑 *DADOS PARA PAGAMENTO (PIX)*`);
    if (providerName) lines.push(`Favorecido: ${providerName}`);
    lines.push(`${pixKeyType || 'Chave PIX'}: *${pixKey}*`);
    if (pixPayloadStr) {
      lines.push(`📋 *PIX Copia e Cola:*`);
      lines.push(pixPayloadStr);
    }
  }

  lines.push(``);
  lines.push(`Qualquer dúvida, estou à disposição. 🙏${providerName ? `\n— ${providerName}` : ''}`);

  return lines.join('\n');
}

/**
 * Mensagem de reativação de cliente inativo.
 */
export function buildReactivationMessage({ clientName, techName, lastEventTitle, daysSince }) {
  const name = clientName || 'Cliente';
  const tech = techName || '';
  const lines = [
    `Oi, ${name}! Tudo bem? 😊`,
    ``,
  ];
  if (lastEventTitle && daysSince > 0) {
    lines.push(`Faz um tempo desde o *${lastEventTitle}* — passaram uns ${Math.round(daysSince / 30)} mes${Math.round(daysSince / 30) !== 1 ? 'es' : ''} já!`);
  } else {
    lines.push(`Faz um tempinho que não trabalhamos juntos!`);
  }
  lines.push(
    ``,
    `Queria me reaproximar e saber se tem algum evento ou projeto chegando por aí. 🎶`,
    ``,
    `Estou disponível — me chama quando quiser! 🙌`,
  );
  if (tech) lines.push(``, `— ${tech}`);
  return lines.join('\n');
}

/**
 * Gera mensagem de disponibilidade mensal para compartilhar com clientes.
 * @param {object} opts
 * @param {string}   opts.monthLabel  — Ex: "Julho de 2026"
 * @param {number[]} opts.freeDays    — Dias livres (1-31)
 * @param {Array}    opts.bookedShows — [{ day, title }]
 * @param {string}   [opts.techName]
 */
export function buildAvailabilityMessage({ monthLabel, freeDays, bookedShows, techName }) {
  const lines = [
    `📅 *Disponibilidade — ${monthLabel}*`,
    ``,
  ];

  if (freeDays.length > 0) {
    lines.push(`✅ *Dias disponíveis:*`);
    lines.push(freeDays.join(', '));
    lines.push(``);
  } else {
    lines.push(`❌ Sem dias disponíveis neste mês.`);
    lines.push(``);
  }

  if (bookedShows.length > 0) {
    lines.push(`📌 *Já agendado:*`);
    bookedShows.forEach(s => {
      lines.push(`• Dia ${s.day} — ${s.title}`);
    });
    lines.push(``);
  }

  lines.push(`Para agendar, é só me chamar! 🎶`);
  if (techName) lines.push(`— ${techName}`);

  return lines.join('\n');
}
