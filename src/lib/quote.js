// Orçamento em PDF para a produtora (ideia #111): dados prontos para o QuotePDFDocument.
import { calcEventDays, getEventCacheAmount } from '@/lib/eventFinance';
import { resolveMealPolicy } from '@/lib/mealPolicy';
import { categoryLabel } from '@/lib/roleRates';

export const QUOTE_VALIDITY_DAYS = 7;

const isoLocal = (d) => d.toLocaleDateString('sv-SE');
const plain = (v) => String(v || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const locationHasCity = (event) => Boolean(event?.location_city && plain(event?.location).includes(plain(event.location_city)));

function paymentModelText(model) {
  if (model === 'MEIO_CACHE_E_DOBRA') {
    return 'Até 6 horas: meio cachê. Até 12 horas: cachê cheio. Acima de 12 horas: dobra.';
  }
  return 'Diária com jornada de até 12 horas; horas além disso são cobradas como extras.';
}

const MEAL_TEXT = {
  reembolso: 'Alimentação por conta do contratante (reembolso).',
  pago_no_local: 'Alimentação fornecida no local pelo contratante.',
  custo_proprio: 'Alimentação por conta do prestador.',
};

export function buildQuote({ event, client, settings = {}, profile = {}, today = new Date(), validityDays = QUOTE_VALIDITY_DAYS }) {
  const days = calcEventDays(event || {});
  const total = getEventCacheAmount(event || {});
  const dailyRate = Number(event?.daily_cache_value) > 0 ? Number(event.daily_cache_value) : (days > 0 ? total / days : total);
  const valid = new Date(today.getFullYear(), today.getMonth(), today.getDate() + validityDays);
  const stamp = isoLocal(today).replace(/-/g, '').slice(2);
  const suffix = String(event?.id || '').replace(/-/g, '').slice(-4).toUpperCase() || '0000';
  const meal = resolveMealPolicy(event, client);

  const terms = [paymentModelText(event?.payment_model)];
  if (MEAL_TEXT[meal]) terms.push(MEAL_TEXT[meal]);
  terms.push(event?.payment_due_date
    ? `Pagamento até ${event.payment_due_date.split('-').reverse().join('/')}.`
    : 'Pagamento em até 30 dias após o evento, salvo combinado diferente.');
  if (settings.pix_key) terms.push(`PIX (${settings.pix_key_type || 'chave'}): ${settings.pix_key}`);
  terms.push(`Orçamento válido até ${isoLocal(valid).split('-').reverse().join('/')}.`);

  const cityState = [profile.city, profile.state].filter(Boolean).join(' / ');
  return {
    number: `ORC-${stamp}-${suffix}`,
    issuedAt: isoLocal(today),
    validUntil: isoLocal(valid),
    provider: {
      name: settings.report_full_name || profile.name || 'Técnico de Eventos',
      doc: settings.cpf_cnpj || '',
      subtitle: settings.report_subtitle || settings.report_profession || categoryLabel(profile.category) || '',
      phone: profile.phone || '',
      city: cityState,
    },
    client: {
      name: client?.name || 'Contratante',
      company: client?.company && client.company !== client?.name ? client.company : '',
      phone: client?.phone || '',
      email: client?.email || '',
    },
    service: {
      title: event?.title || 'Evento',
      functionLabel: event?.category_label || categoryLabel(event?.category) || categoryLabel(profile.category) || 'Serviços técnicos',
      startDate: event?.start_date || '',
      endDate: event?.end_date || event?.start_date || '',
      startTime: event?.start_time ? String(event.start_time).slice(0, 5) : '',
      endTime: event?.end_time ? String(event.end_time).slice(0, 5) : '',
      location: event?.location || '',
      // Sem repetir a cidade quando o endereço já traz ("Allianz Parque - São Paulo/SP")
      city: locationHasCity(event) ? '' : [event?.location_city, event?.location_state].filter(Boolean).join(' / '),
    },
    values: { dailyRate: Math.round(dailyRate * 100) / 100, days, total },
    terms,
  };
}

/** Texto curto para acompanhar o PDF no WhatsApp. */
export function quoteMessage(quote) {
  const brl = quote.values.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return `Olá${quote.client.name !== 'Contratante' ? `, ${quote.client.name}` : ''}! Segue o orçamento (${quote.number}) para ${quote.service.title}: ${quote.values.days} diária${quote.values.days !== 1 ? 's' : ''}, total ${brl}. Válido até ${quote.validUntil.split('-').reverse().join('/')}.`;
}
