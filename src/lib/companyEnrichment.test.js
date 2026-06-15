import { describe, it, expect } from 'vitest';
import {
  mergeCompanyRecord,
  normalizeCompanyKey,
  clientDataFromCompany,
  companyPatchFromClient,
  getCompanyLogoUrl,
} from './companyEnrichment';

describe('normalizeCompanyKey', () => {
  it('ignora acentos e caixa', () => {
    expect(normalizeCompanyKey('Amarrók')).toBe(normalizeCompanyKey('amarrok'));
  });
});

describe('mergeCompanyRecord', () => {
  it('preenche campos vazios', () => {
    const merged = mergeCompanyRecord(
      { id: '1', name: 'R1', phone: null, verified: false },
      { phone: '11999999999', source: 'manual' },
    );
    expect(merged.phone).toBe('11999999999');
  });

  it('não sobrescreve dado verificado com manual', () => {
    const merged = mergeCompanyRecord(
      { name: 'R1 Audiovisual', phone: '1133333333', verified: true, source: 'brasilapi' },
      { phone: '11999999999', source: 'manual' },
    );
    expect(merged.phone).toBe('1133333333');
  });

  it('API verificada pode substituir manual', () => {
    const merged = mergeCompanyRecord(
      { name: 'R1', phone: '11999999999', verified: false, source: 'manual' },
      { phone: '1133333333', verified: true, source: 'brasilapi' },
    );
    expect(merged.phone).toBe('1133333333');
    expect(merged.verified).toBe(true);
  });
});

describe('clientDataFromCompany', () => {
  it('monta client pessoal com company_id e logo', () => {
    const data = clientDataFromCompany({
      id: 'co-1',
      name: 'Razão LTDA',
      trading_name: 'R1 Audiovisual',
      email: 'a@b.com',
      logo_url: 'https://cdn/logo.png',
      verified: true,
    });
    expect(data.name).toBe('R1 Audiovisual');
    expect(data.company_id).toBe('co-1');
    expect(data.logo_url).toBe('https://cdn/logo.png');
    expect(data.profile_complete).toBe(true);
  });
});

describe('companyPatchFromClient', () => {
  it('ignora pessoa física', () => {
    expect(companyPatchFromClient({ client_type: 'pessoa', name: 'João' })).toBeNull();
  });

  it('extrai campos úteis', () => {
    const patch = companyPatchFromClient({
      client_type: 'empresa',
      name: 'Amarrok',
      phone: '11',
      logo_url: 'https://x.png',
    });
    expect(patch.trading_name).toBe('Amarrok');
    expect(patch.logo_url).toBe('https://x.png');
  });
});

describe('getCompanyLogoUrl', () => {
  it('usa logo_url quando existir', () => {
    expect(getCompanyLogoUrl({ logo_url: 'https://a.png' })).toBe('https://a.png');
  });

  it('fallback clearbit por website', () => {
    expect(getCompanyLogoUrl({ website: 'https://amarrok.com.br' })).toContain('clearbit.com/amarrok.com.br');
  });
});
