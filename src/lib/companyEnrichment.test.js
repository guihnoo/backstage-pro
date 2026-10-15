import { describe, it, expect } from 'vitest';
import {
  mergeCompanyRecord,
  normalizeCompanyKey,
  clientDataFromCompany,
  companyPatchFromClient,
  getCompanyLogoUrl,
  withCompanyLogo,
  stripInheritedLogo,
  isValidCNPJ,
  buildCompanySuggestions,
} from './companyEnrichment';

describe('normalizeCompanyKey', () => {
  it('ignora acentos e caixa', () => {
    expect(normalizeCompanyKey('Amarrök')).toBe(normalizeCompanyKey('amarrok'));
  });
});

describe('mergeCompanyRecord', () => {
  it('preenche campos vazios', () => {
    const merged = mergeCompanyRecord(
      { id: '1', name: 'R1', city: null, verified: false },
      { city: 'São Paulo', source: 'manual' },
    );
    expect(merged.city).toBe('São Paulo');
  });

  it('não sobrescreve dado verificado com manual', () => {
    const merged = mergeCompanyRecord(
      { name: 'R1 Audiovisual', city: 'Campinas', verified: true, source: 'brasilapi' },
      { city: 'Santos', source: 'manual' },
    );
    expect(merged.city).toBe('Campinas');
  });

  it('API verificada pode substituir manual', () => {
    const merged = mergeCompanyRecord(
      { name: 'R1', city: 'Santos', verified: false, source: 'manual' },
      { city: 'Campinas', verified: true, source: 'brasilapi' },
    );
    expect(merged.city).toBe('Campinas');
    expect(merged.verified).toBe(true);
  });

  it('telefone e e-mail digitados não vão para o catálogo', () => {
    const merged = mergeCompanyRecord(
      { id: '1', name: 'R1', phone: null, email: null, verified: false },
      { phone: '11999999999', email: 'pessoal@x.com', source: 'manual' },
    );
    expect(merged.phone).toBeNull();
    expect(merged.email).toBeNull();
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
    expect(data.email).toBe('a@b.com');
    expect(data.profile_complete).toBe(true);
  });

  it('não copia contato de empresa não verificada', () => {
    const data = clientDataFromCompany({ id: 'co-2', name: 'X', phone: '11 9', email: 'x@y.com', verified: false });
    expect(data.phone).toBeNull();
    expect(data.email).toBeNull();
  });
});

describe('companyPatchFromClient', () => {
  it('ignora pessoa física', () => {
    expect(companyPatchFromClient({ client_type: 'pessoa', name: 'João' })).toBeNull();
  });

  it('extrai só dado público (nome e logo)', () => {
    const patch = companyPatchFromClient({
      client_type: 'empresa',
      name: 'Amarrok',
      phone: '11',
      email: 'eu@x.com',
      city: 'SP',
      logo_url: 'https://x.png',
    });
    expect(patch.trading_name).toBe('Amarrok');
    expect(patch.logo_url).toBe('https://x.png');
    expect(patch.phone).toBeUndefined();
    expect(patch.email).toBeUndefined();
    expect(patch.city).toBeUndefined();
  });

  it('não devolve ao catálogo o logo que veio do catálogo', () => {
    const patch = companyPatchFromClient({ client_type: 'empresa', name: 'A', logo_url: 'https://c.png', logo_from_company: true });
    expect(patch.logo_url).toBeNull();
  });
});

describe('withCompanyLogo / stripInheritedLogo', () => {
  it('ficha sem logo mostra o logo do catálogo', () => {
    const c = withCompanyLogo({ id: 'c1', logo_url: null, company: { logo_url: 'https://cat.png' } });
    expect(c.logo_url).toBe('https://cat.png');
    expect(c.logo_from_company).toBe(true);
    expect(c.company).toBeUndefined();
  });

  it('logo próprio tem prioridade', () => {
    const c = withCompanyLogo({ id: 'c1', logo_url: 'https://meu.png', company: { logo_url: 'https://cat.png' } });
    expect(c.logo_url).toBe('https://meu.png');
    expect(c.logo_from_company).toBeUndefined();
  });

  it('ao salvar, logo herdado não vira logo pessoal', () => {
    const original = { id: 'c1', logo_url: 'https://cat.png', logo_from_company: true };
    expect(stripInheritedLogo({ name: 'A', logo_url: 'https://cat.png', logo_from_company: true }, original).logo_url).toBeNull();
    expect(stripInheritedLogo({ name: 'A', logo_url: 'https://novo.png' }, original).logo_url).toBe('https://novo.png');
  });
});

describe('isValidCNPJ', () => {
  it('aceita CNPJ válido com ou sem máscara', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    expect(isValidCNPJ('11222333000181')).toBe(true);
  });
  it('recusa dígito errado, repetidos e tamanho errado', () => {
    expect(isValidCNPJ('11222333000182')).toBe(false);
    expect(isValidCNPJ('11111111111111')).toBe(false);
    expect(isValidCNPJ('123')).toBe(false);
  });
});

describe('buildCompanySuggestions', () => {
  it('logo diferente do catálogo vira sugestão', () => {
    const s = buildCompanySuggestions({ id: 'co', logo_url: 'https://a.png' }, { logo_url: 'https://b.png' });
    expect(s).toEqual([{ company_id: 'co', field: 'logo_url', current_value: 'https://a.png', suggested_value: 'https://b.png' }]);
  });
  it('catálogo sem logo não gera sugestão (preenche direto)', () => {
    expect(buildCompanySuggestions({ id: 'co', logo_url: null }, { logo_url: 'https://b.png' })).toEqual([]);
  });
  it('mesmo logo não gera sugestão', () => {
    expect(buildCompanySuggestions({ id: 'co', logo_url: 'https://a.png' }, { logo_url: 'https://a.png' })).toEqual([]);
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
