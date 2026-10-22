import { describe, it, expect } from 'vitest';
import { buildQuote, quoteMessage } from './quote';

const today = new Date(2026, 9, 22);
const event = {
  id: '00000000-0000-4000-8000-0000000abcd1',
  title: 'Feira Agro',
  start_date: '2026-11-12',
  end_date: '2026-11-14',
  start_time: '08:00:00',
  end_time: '18:00:00',
  daily_cache_value: 850,
  payment_model: 'HORAS_EXTRAS',
  location: 'Centro de Eventos',
  location_city: 'Ribeirão Preto',
  location_state: 'SP',
  category: 'lighting',
  category_label: 'Iluminação',
};
const client = { name: 'Palco Norte Produções', company: 'Palco Norte Produções LTDA', phone: '11988887777', meal_policy: 'reembolso' };
const settings = { report_full_name: 'Guilherme Monteiro', cpf_cnpj: '12.345.678/0001-90', pix_key: 'guih@pix.com', pix_key_type: 'E-mail' };
const profile = { name: 'Guih', city: 'São Paulo', state: 'SP', category: 'lighting' };

describe('buildQuote', () => {
  const q = buildQuote({ event, client, settings, profile, today });

  it('número, emissão e validade de 7 dias', () => {
    expect(q.number).toBe('ORC-261022-BCD1');
    expect(q.issuedAt).toBe('2026-10-22');
    expect(q.validUntil).toBe('2026-10-29');
  });

  it('valores: diárias × cachê', () => {
    expect(q.values).toEqual({ dailyRate: 850, days: 3, total: 2550 });
  });

  it('prestador pelos dados do Perfil/PIX (não "Técnico de Eventos")', () => {
    expect(q.provider).toMatchObject({ name: 'Guilherme Monteiro', doc: '12.345.678/0001-90', city: 'São Paulo / SP' });
  });

  it('serviço com função, horário e local', () => {
    expect(q.service).toMatchObject({
      functionLabel: 'Iluminação', startTime: '08:00', endTime: '18:00', city: 'Ribeirão Preto / SP',
    });
  });

  it('condições conforme o modelo de pagamento, alimentação e PIX', () => {
    expect(q.terms.join(' | ')).toContain('jornada de até 12 horas');
    expect(q.terms.join(' | ')).toContain('Alimentação por conta do contratante');
    expect(q.terms.join(' | ')).toContain('PIX (E-mail): guih@pix.com');
    expect(q.terms.at(-1)).toBe('Orçamento válido até 29/10/2026.');
  });

  it('meio cachê e dobra muda a regra', () => {
    const q2 = buildQuote({ event: { ...event, payment_model: 'MEIO_CACHE_E_DOBRA' }, client, settings, profile, today });
    expect(q2.terms[0]).toContain('meio cachê');
  });

  it('sem dados do PIX/Perfil ainda gera', () => {
    const q3 = buildQuote({ event: { title: 'Show', start_date: '2026-11-01' }, today });
    expect(q3.provider.name).toBe('Técnico de Eventos');
    expect(q3.client.name).toBe('Contratante');
    expect(q3.values.days).toBe(1);
  });

  it('não repete a cidade quando o endereço já traz', () => {
    const q4 = buildQuote({ event: { ...event, location: 'Arena - Ribeirão Preto/SP' }, today });
    expect(q4.service.city).toBe('');
  });

  it('mensagem para o WhatsApp', () => {
    // toLocaleString põe espaço não separável entre R$ e o número
    expect(quoteMessage(q).replace(/\u00a0/g, ' ')).toBe('Olá, Palco Norte Produções! Segue o orçamento (ORC-261022-BCD1) para Feira Agro: 3 diárias, total R$ 2.550,00. Válido até 29/10/2026.');
  });
});
