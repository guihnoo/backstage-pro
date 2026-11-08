import { describe, expect, it } from 'vitest';
import { normalizeCompanyName, reconcileNFe, nfeChosenAmount, clientKnownNames } from './nfeReconcile';
import { calculateEventReceivableAmount } from './eventFinance';

const empresa = {
  id: 'c1', name: 'Palco Norte', client_type: 'empresa', company: 'Palco Norte Produções',
};
const vinculada = { ...empresa, company: { cnpj: '12.345.678/0001-90', name: 'PALCO NORTE PRODUCOES ARTISTICAS LTDA', trading_name: 'Palco Norte' } };

describe('normalizeCompanyName', () => {
  it('tira acento, pontuação e LTDA/ME/S/A', () => {
    expect(normalizeCompanyName('Palco Norte Produções Ltda.')).toBe('palco norte producoes');
    expect(normalizeCompanyName('ACME S/A')).toBe('acme');
    expect(normalizeCompanyName('João & Cia ME')).toBe('joao');
  });
});

describe('reconcileNFe — empresa', () => {
  it('CNPJ igual reconhece mesmo com razão social diferente do nome do cadastro', () => {
    const r = reconcileNFe({ analise: { nfe_tomador_nome: 'PNP EVENTOS SA', nfe_tomador_cnpj: '12345678000190' }, client: vinculada, expectedAmount: 0 });
    expect(r.empresa).toBe('cnpj');
  });
  it('sem CNPJ no cadastro, reconhece a razão social que contém o nome fantasia', () => {
    const r = reconcileNFe({ analise: { nfe_tomador_nome: 'PALCO NORTE PRODUCOES LTDA', nfe_tomador_cnpj: '98765432000111' }, client: empresa, expectedAmount: 0 });
    expect(r.empresa).toBe('nome');
    expect(r.podeVincularCnpj).toBe(true);
  });
  it('nome e CNPJ de outra empresa apontam divergência', () => {
    expect(reconcileNFe({ analise: { nfe_tomador_nome: 'Outra Produtora LTDA', nfe_tomador_cnpj: '11111111000111' }, client: vinculada, expectedAmount: 0 }).empresa).toBe('cnpj_diferente');
    expect(reconcileNFe({ analise: { nfe_tomador_nome: 'Outra Produtora LTDA' }, client: empresa, expectedAmount: 0 }).empresa).toBe('nome_diferente');
  });
  it('lista os nomes conhecidos do cliente', () => {
    expect(clientKnownNames(vinculada)).toEqual(['palco norte', 'palco norte producoes artisticas']);
  });
});

describe('reconcileNFe — valor', () => {
  it('compara com o valor calculado do trabalho e dá a diferença', () => {
    const ok = reconcileNFe({ analise: { nfe_valor: 1050.5 }, client: empresa, expectedAmount: 1050 });
    expect(ok.valor).toBe('confere');
    const dif = reconcileNFe({ analise: { nfe_valor: 1200 }, client: empresa, expectedAmount: 1050 });
    expect(dif).toMatchObject({ valor: 'diferente', valorNota: 1200, valorApp: 1050, diferenca: 150, escolha: null });
    expect(reconcileNFe({ analise: { nfe_valor: 1200, escolha_valor: 'nota' }, client: empresa, expectedAmount: 1050 }).escolha).toBe('nota');
  });
});

describe('valor da nota escolhido entra no A receber', () => {
  const event = { id: 'e1', start_date: '2026-11-01', end_date: '2026-11-01', daily_cache_value: 900 };
  it('sem escolha vale o cálculo do app', () => {
    expect(nfeChosenAmount(event)).toBeNull();
    expect(calculateEventReceivableAmount(event, [])).toBe(900);
  });
  it('"usar valor da nota" substitui o valor do trabalho', () => {
    const comNota = { ...event, nfe_analise: { nfe_valor: 1234.56, escolha_valor: 'nota' } };
    expect(nfeChosenAmount(comNota)).toBe(1234.56);
    expect(calculateEventReceivableAmount(comNota, [{ date: '2026-11-01', daily_cache: 1050 }])).toBe(1234.56);
  });
  it('"manter valor do app" não muda nada', () => {
    const app = { ...event, nfe_analise: { nfe_valor: 1234.56, escolha_valor: 'app' } };
    expect(calculateEventReceivableAmount(app, [])).toBe(900);
  });
});
