import { describe, it, expect } from 'vitest';
import { buildEventReport, formatBRL } from './whatsapp';
import { buildEventClosing } from './eventClosing';

const event = {
  title: 'Show Teste',
  start_date: '2026-10-01',
  end_date: '2026-10-02',
  daily_cache_value: 1200,
  cache_value: 2400,
};
const work = [{ date: '2026-10-01', daily_cache: 1300, total_hours: 13, overtime_hours: 1 }];
const expenses = [
  { amount: '150.50', is_reimbursable: true, title: 'Uber' },
  { amount: 99, is_reimbursable: true, reimbursed: true, title: 'Já pago' },
];

describe('relatório do WhatsApp = fechamento do PDF', () => {
  it('total do WhatsApp é o mesmo total do fechamento', () => {
    const closing = buildEventClosing(event, work, expenses);
    const text = buildEventReport({ event, client: { name: 'Cliente X' }, work, expenses });
    expect(text).toContain(formatBRL(closing.total));
    expect(text).toContain(formatBRL(closing.totalReembolsos));
  });

  it('formatBRL aceita valor em texto', () => {
    expect(formatBRL('150.50')).toBe(formatBRL(150.5));
    expect(formatBRL('abc')).toBe(formatBRL(0));
  });
});
