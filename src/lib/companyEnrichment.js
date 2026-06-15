import { pickDefaultClientColor } from '@/lib/brandColors';

/** Campos que qualquer usuário pode enriquecer (preenche vazio; API verificada tem prioridade). */
export const ENRICHABLE_COMPANY_FIELDS = [
  'trading_name',
  'city',
  'state',
  'address',
  'phone',
  'email',
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
    email: company.email || null,
    phone: company.phone || null,
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
  return {
    name,
    trading_name: name,
    phone: client.phone || null,
    email: client.email || null,
    logo_url: client.logo_url || null,
    city: client.city || null,
    state: client.state || null,
    source: 'manual',
  };
}
