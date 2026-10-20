import { pickDefaultClientColor } from '@/lib/brandColors';

/** Campos que qualquer usuário pode enriquecer (preenche vazio; API verificada tem prioridade). */
export const ENRICHABLE_COMPANY_FIELDS = [
  'trading_name',
  'city',
  'state',
  'address',
  'website',
  'logo_url',
  'cnae',
  'porte',
];

const VERIFIED_SOURCES = new Set(['brasilapi', 'cnpja', 'nfe']);

export function normalizeCompanyKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getCompanyDisplayName(company) {
  if (!company) return '';
  return company.trading_name || company.name || '';
}

export function getCompanyLogoUrl(company) {
  if (!company) return null;
  if (company.logo_url) return company.logo_url;
  const website = company.website || company.domain;
  if (!website) return null;
  const host = String(website).replace(/^https?:\/\//, '').split('/')[0];
  return host ? `https://logo.clearbit.com/${host}` : null;
}

/**
 * Mescla dados novos na empresa global sem apagar informação verificada.
 */
export function mergeCompanyRecord(existing, patch) {
  if (!existing) return { ...patch };
  const next = { ...existing };
  const existingVerified = existing.verified === true;
  const patchVerified = patch.verified === true || VERIFIED_SOURCES.has(patch.source);

  for (const field of ENRICHABLE_COMPANY_FIELDS) {
    const incoming = patch[field];
    if (incoming == null || incoming === '') continue;
    const current = next[field];
    if (!current) {
      next[field] = incoming;
      continue;
    }
    if (patchVerified && !existingVerified) {
      next[field] = incoming;
    }
  }

  if (!next.name?.trim() && patch.name?.trim()) next.name = patch.name.trim();
  if (!next.trading_name?.trim() && patch.trading_name?.trim()) next.trading_name = patch.trading_name.trim();
  if (!next.cnpj && patch.cnpj) next.cnpj = String(patch.cnpj).replace(/\D/g, '') || null;

  if (patchVerified) {
    next.verified = true;
    if (patch.source && VERIFIED_SOURCES.has(patch.source)) next.source = patch.source;
  }

  return next;
}

export function buildCompanyPatchDiff(existing, merged) {
  const patch = {};
  for (const key of Object.keys(merged)) {
    if (['id', 'created_at', 'created_by', 'updated_at'].includes(key)) continue;
    if (merged[key] !== existing[key]) patch[key] = merged[key];
  }
  return patch;
}

/** Dados iniciais do client pessoal a partir da empresa global. */
export function clientDataFromCompany(company, overrides = {}) {
  const displayName = getCompanyDisplayName(company);
  return {
    client_type: 'empresa',
    name: displayName,
    // Contato só vem do catálogo quando é dado oficial (consulta de CNPJ), nunca o que outro usuário digitou.
    email: company.verified ? company.email || null : null,
    phone: company.verified ? company.phone || null : null,
    logo_url: company.logo_url || null,
    company_id: company.id,
    profile_complete: !!(company.cnpj || company.verified),
    brand_color: pickDefaultClientColor(displayName),
    ...overrides,
  };
}

/** Extrai da carteira pessoal o que pode enriquecer o cadastro global. */
export function companyPatchFromClient(client) {
  if (!client || client.client_type === 'pessoa') return null;
  const name = client.name?.trim();
  if (!name) return null;
  // Só dado público da empresa vai para o catálogo. Telefone, e-mail e cidade digitados
  // ficam apenas na carteira de quem digitou.
  return {
    name,
    trading_name: name,
    logo_url: client.logo_from_company ? null : client.logo_url || null,
    source: 'manual',
  };
}

/** Cliente sem logo próprio mostra o logo do catálogo (sem gravar na ficha pessoal). */
export function withCompanyLogo(client) {
  if (!client) return client;
  const { company, ...rest } = client;
  const companyLogo = company?.logo_url || null;
  if (!rest.logo_url && companyLogo) {
    return { ...rest, logo_url: companyLogo, logo_from_company: true };
  }
  return rest;
}

/** Na hora de salvar: logo herdado do catálogo não vira logo pessoal. */
export function stripInheritedLogo(payload, original) {
  if (!payload) return payload;
  const next = { ...payload };
  delete next.company;
  delete next.logo_from_company;
  if (original?.logo_from_company && next.logo_url === original.logo_url) {
    next.logo_url = null;
  }
  return next;
}

/** CNPJ com dígitos verificadores corretos. */
export function isValidCNPJ(value) {
  const d = String(value || '').replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len) => {
    const pesos = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = pesos.reduce((acc, p, i) => acc + Number(d[i]) * p, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** Campos em que a troca de um valor já existente vira sugestão para o dono aprovar. */
export const SUGGESTABLE_COMPANY_FIELDS = ['logo_url'];

/** Diferenças entre o que o usuário tem e o catálogo que viram sugestão (não altera nada). */
export function buildCompanySuggestions(existing, patch) {
  if (!existing || !patch) return [];
  return SUGGESTABLE_COMPANY_FIELDS.filter((field) => {
    const current = existing[field];
    const incoming = patch[field];
    return current && incoming && String(current) !== String(incoming);
  }).map((field) => ({
    company_id: existing.id,
    field,
    current_value: String(existing[field]),
    suggested_value: String(patch[field]),
  }));
}
