import { describe, it, expect } from 'vitest';
import {
  buildClosingShareData,
  encodeClosingSharePayload,
  decodeClosingSharePayload,
  buildClosingShareUrl,
} from './closingShareLink';

describe('closingShareLink', () => {
  it('codifica e decodifica dados completos de fechamento (UTF-8, NF-e e PIX)', () => {
    const sample = buildClosingShareData({
      event: {
        id: 'ev-1',
        title: 'Festival São Paulo — Iluminação',
        start_date: '2026-10-15',
        end_date: '2026-10-16',
        location: 'Allianz Parque',
        location_city: 'São Paulo',
        location_state: 'SP',
        daily_rate: 1000,
        cache: 2000,
        nfe_numero: '000458',
        nf_issued_at: '2026-10-17',
      },
      client: {
        name: 'Produtora Luz & Ação Ltda',
        cnpj: '12.345.678/0001-99',
      },
      work: [
        {
          event_id: 'ev-1',
          work_date: '2026-10-15',
          entry_time: '08:00',
          exit_time: '20:00',
          total_hours: 12,
          daily_rate: 1000,
          total_value: 1000,
        },
      ],
      expenses: [
        {
          event_id: 'ev-1',
          expense_date: '2026-10-15',
          category: 'transporte',
          title: 'Uber Aeroporto',
          amount: 85.5,
          is_reimbursable: true,
        },
      ],
      profile: {
        name: 'Will Monteiro',
        category: 'lighting',
        city: 'São Paulo',
        state: 'SP',
      },
      userSettings: {
        pix_key: '12345678909',
        pix_key_type: 'CPF',
        cpf_cnpj: '123.456.789-09',
      },
    });

    const token = encodeClosingSharePayload(sample);
    const decoded = decodeClosingSharePayload(token);

    expect(decoded).not.toBeNull();
    expect(decoded.provider.name).toBe('Will Monteiro');
    expect(decoded.client.name).toBe('Produtora Luz & Ação Ltda');
    expect(decoded.nfe.number).toBe('000458');
    expect(decoded.pix.key).toBe('12345678909');
    expect(decoded.pix.payload.toUpperCase()).toContain('BR.GOV.BCB.PIX');
    expect(decoded.closing.totalReembolsos).toBe(85.5);
    expect(decoded.closing.total).toBeGreaterThan(1000);

    const url = buildClosingShareUrl(
      {
        event: { title: 'Show', start_date: '2026-10-15', daily_rate: 500 },
        client: { name: 'Cliente' },
      },
      'https://backstagepro.app'
    );
    expect(url.startsWith('https://backstagepro.app/fechamento?d=')).toBe(true);
  });
});
