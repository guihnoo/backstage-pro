/**
 * Busca de empresas via APIs públicas brasileiras.
 * Primária: open.cnpja.com (busca por nome + CNPJ, CORS habilitado)
 * Fallback:  brasilapi.com.br (CNPJ direto, 100% gratuita)
 */

const CNPJA_BASE = 'https://open.cnpja.com';
const BRASILAPI  = 'https://brasilapi.com.br/api/cnpj/v1';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function cleanCNPJ(str) {
  return String(str || '').replace(/\D/g, '');
}

export function formatCNPJ(cnpj) {
  const c = cleanCNPJ(cnpj);
  if (c.length !== 14) return cnpj || '';
  return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}`;
}

export function looksLikeCNPJ(str) {
  return cleanCNPJ(str).length >= 11;
}

// ── Busca por nome ────────────────────────────────────────────────────────────

/**
 * Busca empresas por nome ou CNPJ.
 * Retorna array de resultados normalizados.
 */
export async function searchCompanies(query, signal) {
  const q = query.trim();
  if (q.length < 3) return [];

  // Se parece CNPJ → lookup direto
  if (looksLikeCNPJ(q)) {
    const result = await fetchByCNPJ(cleanCNPJ(q), signal);
    return result ? [result] : [];
  }

  // Busca por nome via cnpja.com
  try {
    const res = await fetch(
      `${CNPJA_BASE}/company/search?query=${encodeURIComponent(q)}&limit=10`,
      { signal }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items = data.companies || data.data || (Array.isArray(data) ? data : []);
    return items.map(mapCnpjaSearchItem).filter(Boolean);
  } catch (err) {
    if (err.name === 'AbortError') return [];
    // CORS ou API fora do ar → retorna vazio (usuário verá opção de inserir manual)
    console.warn('[cnpjSearch] busca por nome falhou:', err.message);
    return [];
  }
}

// ── Lookup por CNPJ ───────────────────────────────────────────────────────────

/**
 * Busca dados completos de uma empresa pelo CNPJ.
 * Usa BrasilAPI (confiável, oficial, CORS OK).
 */
export async function fetchByCNPJ(cnpj, signal) {
  const clean = cleanCNPJ(cnpj);
  if (clean.length !== 14) return null;

  // Tenta BrasilAPI primeiro (mais estável)
  try {
    const res = await fetch(`${BRASILAPI}/${clean}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    return mapBrasilAPI(d);
  } catch (err) {
    if (err.name === 'AbortError') return null;
  }

  // Fallback: cnpja.com
  try {
    const res = await fetch(`${CNPJA_BASE}/cnpj/${clean}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    return mapCnpjaDetail(d);
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[cnpjSearch] fallback cnpja falhou:', err.message);
    return null;
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapCnpjaSearchItem(item) {
  if (!item) return null;
  const cnpj = cleanCNPJ(item.taxId || item.cnpj || '');
  const name = item.alias || item.company?.name || item.name || '';
  const razao = item.company?.name || item.name || name;
  const city  = item.address?.city?.name || item.address?.municipality || '';
  const state = item.address?.state || '';
  return {
    cnpj,
    name: name || razao,
    trading_name: name !== razao ? name : null,
    razao_social: razao,
    city,
    state,
    status: item.status?.text || 'Ativa',
    source: 'cnpja',
    _partial: true, // ainda não tem dados completos
  };
}

function mapCnpjaDetail(d) {
  if (!d) return null;
  const cnpj = cleanCNPJ(d.taxId || '');
  const name   = d.alias || d.company?.name || '';
  const razao  = d.company?.name || name;
  const phone  = d.phones?.[0]
    ? `(${d.phones[0].area}) ${d.phones[0].number}`
    : '';
  const email  = d.emails?.[0]?.address || '';
  const addr   = d.address
    ? [
        d.address.street, d.address.number, d.address.details,
        d.address.district,
        d.address.city?.name, d.address.state,
        d.address.zip?.replace(/(\d{5})(\d{3})/, '$1-$2'),
      ].filter(Boolean).join(', ')
    : '';
  const contact = d.members?.[0]?.person?.name || '';
  const cnae = d.activities?.find(a => a.isMain)?.text || '';
  const porte = d.company?.size?.text || '';

  return {
    cnpj,
    name: name || razao,
    trading_name: name !== razao ? name : null,
    razao_social: razao,
    city: d.address?.city?.name || '',
    state: d.address?.state || '',
    address: addr,
    phone,
    email,
    website: d.website || '',
    cnae,
    porte,
    contact_person: contact,
    status: d.status?.text || 'Ativa',
    source: 'cnpja',
    _partial: false,
  };
}

function mapBrasilAPI(d) {
  if (!d) return null;
  const cnpj = cleanCNPJ(d.cnpj || '');
  const name   = d.nome_fantasia || d.razao_social || '';
  const razao  = d.razao_social || name;

  const rawPhone = String(d.ddd_telefone_1 || '').replace(/\D/g, '');
  const phone = rawPhone.length >= 10
    ? `(${rawPhone.slice(0,2)}) ${rawPhone.slice(2)}`
    : rawPhone;

  const addr = [
    d.descricao_tipo_de_logradouro, d.logradouro, d.numero,
    d.complemento, d.bairro, d.municipio, d.uf,
    d.cep?.replace(/(\d{5})(\d{3})/, '$1-$2'),
  ].filter(Boolean).join(', ');

  const contact = d.qsa?.[0]?.nome_socio || '';
  const cnae = d.cnae_fiscal_descricao || '';
  const porte = d.descricao_porte || d.porte || '';

  return {
    cnpj,
    name: name || razao,
    trading_name: name && name !== razao ? name : null,
    razao_social: razao,
    city: d.municipio || '',
    state: d.uf || '',
    address: addr,
    phone,
    email: d.email || '',
    website: '',
    cnae,
    porte,
    contact_person: contact,
    status: d.descricao_situacao_cadastral || 'Ativa',
    source: 'brasilapi',
    _partial: false,
  };
}

// ── Build notes block ─────────────────────────────────────────────────────────

/**
 * Gera bloco de notas automáticas com dados da empresa para salvar no client.
 */
export function buildCompanyNotes(company) {
  if (!company) return '';
  const lines = [];
  if (company.razao_social && company.razao_social !== company.name) {
    lines.push(`Razão Social: ${company.razao_social}`);
  }
  if (company.cnpj) lines.push(`CNPJ: ${formatCNPJ(company.cnpj)}`);
  if (company.address) lines.push(`Endereço: ${company.address}`);
  if (company.cnae) lines.push(`Atividade: ${company.cnae}`);
  if (company.porte) lines.push(`Porte: ${company.porte}`);
  return lines.join('\n');
}
