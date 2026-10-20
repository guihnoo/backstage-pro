import { describe, it, expect, vi } from 'vitest';
import {
  buildClosingShareData,
  createClosingShareLink,
  fetchClosingShare,
} from './closingShareLink';

describe('closingShareLink', () => {
  it('monta os dados do fechamento (UTF-8, NF-e e PIX) sem PIX pronto no link', () => {
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

    expect(sample.provider.name).toBe('Will Monteiro');
    expect(sample.nfe.number).toBe('000458');
    expect(sample.pix.key).toBe('12345678909');
    expect(sample.pix.payload).toBeUndefined();
    expect(sample.closing.totalReembolsos).toBe(85.5);
    expect(sample.closing.total).toBeGreaterThan(1000);
  });

  it('cria o link pelo banco e a URL leva so o codigo', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'a'.repeat(64), error: null });
    const url = await createClosingShareLink(
      { event: { id: 'ev-9', title: 'Show', start_date: '2026-10-15', daily_rate: 500 }, client: { name: 'Cliente' },
        userSettings: { pix_key: '123', cpf_cnpj: '123.456.789-09' } },
      { client: { rpc }, origin: 'https://backstagepro.app' }
    );
    expect(url).toBe(`https://backstagepro.app/fechamento?t=${'a'.repeat(64)}`);
    expect(url).not.toMatch(/123\.456|pix|cpf/i);
    expect(rpc).toHaveBeenCalledWith('criar_link_fechamento', expect.objectContaining({ p_event_id: 'ev-9', p_dias: 30 }));
  });

  it('erro do banco vira erro claro e codigo invalido nao busca nada', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'evento nao encontrado' } });
    await expect(createClosingShareLink({ event: { id: 'x' } }, { client: { rpc }, origin: 'https://a' })).rejects.toThrow('evento nao encontrado');
    const rpc2 = vi.fn();
    expect(await fetchClosingShare('curto', { client: { rpc: rpc2 } })).toBeNull();
    expect(rpc2).not.toHaveBeenCalled();
  });
});
