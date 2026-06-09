import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanCNPJ(s: string) {
  return String(s || '').replace(/\D/g, '');
}

function extractDomain(email?: string, website?: string): string | null {
  if (website) {
    try {
      const u = new URL(website.startsWith('http') ? website : `https://${website}`);
      return u.hostname.replace(/^www\./, '');
    } catch { /* ignore */ }
  }
  if (email) {
    const parts = email.split('@');
    if (parts.length === 2) return parts[1].toLowerCase().trim();
  }
  return null;
}

function logoUrl(domain: string | null): string | null {
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapBrasilAPI(d: Record<string, unknown>) {
  const rawPhone = String(d.ddd_telefone_1 || '').replace(/\D/g, '');
  const phone = rawPhone.length >= 10
    ? `(${rawPhone.slice(0, 2)}) ${rawPhone.slice(2)}`
    : rawPhone || null;

  const addrParts = [
    d.descricao_tipo_de_logradouro, d.logradouro, d.numero,
    d.complemento, d.bairro, d.municipio, d.uf,
    String(d.cep || '').replace(/(\d{5})(\d{3})/, '$1-$2'),
  ].filter(Boolean);

  const email  = String(d.email || '').toLowerCase() || null;
  const site   = String(d.website || d.home_page || '') || null;
  const domain = extractDomain(email || undefined, site || undefined);
  const contact = (d.qsa as Array<Record<string,unknown>>)?.[0]?.nome_socio as string || null;

  return {
    cnpj:         cleanCNPJ(String(d.cnpj || '')),
    name:         String(d.nome_fantasia || d.razao_social || ''),
    trading_name: d.nome_fantasia ? String(d.nome_fantasia) : null,
    razao_social: String(d.razao_social || ''),
    city:         String(d.municipio || ''),
    state:        String(d.uf || ''),
    address:      addrParts.join(', '),
    phone,
    email,
    website:      site,
    cnae:         String(d.cnae_fiscal_descricao || ''),
    porte:        String(d.descricao_porte || d.porte || ''),
    status:       String(d.descricao_situacao_cadastral || 'Ativa'),
    contact_person: contact,
    logo_url:     logoUrl(domain),
    domain,
    source:       'brasilapi',
    verified:     true,
  };
}

function mapCnpjaSearch(item: Record<string, unknown>) {
  const addr = item.address as Record<string, unknown> | undefined;
  const company = item.company as Record<string, unknown> | undefined;
  const cnpj = cleanCNPJ(String(item.taxId || item.cnpj || ''));
  const name = String(item.alias || company?.name || item.name || '');
  const razao = String(company?.name || name);
  const city  = String((addr?.city as Record<string,unknown>)?.name || addr?.municipality || '');
  const state = String(addr?.state || '');

  const phones = (item.phones as Array<Record<string, unknown>>) || [];
  const emails = (item.emails as Array<Record<string, unknown>>) || [];
  const phone  = phones[0] ? `(${phones[0].area}) ${phones[0].number}` : null;
  const email  = String(emails[0]?.address || '') || null;
  const site   = String(item.website || '') || null;
  const domain = extractDomain(email || undefined, site || undefined);
  const status = (item.status as Record<string,unknown>)?.text as string || 'Ativa';
  const cnae   = (item.activities as Array<Record<string,unknown>>)?.find(a => a.isMain)?.text as string || '';
  const porte  = (company?.size as Record<string,unknown>)?.text as string || '';
  const members = (item.members as Array<Record<string,unknown>>) || [];
  const contact = (members[0]?.person as Record<string,unknown>)?.name as string || null;

  return {
    cnpj,
    name: name || razao,
    trading_name: name && name !== razao ? name : null,
    razao_social: razao,
    city,
    state,
    address: [addr?.street, addr?.number, addr?.details, addr?.district, city, state].filter(Boolean).join(', '),
    phone,
    email,
    website: site,
    cnae,
    porte,
    status,
    contact_person: contact,
    logo_url: logoUrl(domain),
    domain,
    source: 'cnpja',
    verified: true,
    _partial: true,
  };
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleCNPJ(cnpj: string): Promise<Record<string, unknown>[]> {
  const clean = cleanCNPJ(cnpj);
  if (clean.length !== 14) return [];

  // BrasilAPI — confiável, oficial
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (r.ok) {
      const d = await r.json();
      return [mapBrasilAPI(d)];
    }
  } catch { /* continua */ }

  // Fallback: open.cnpja.com
  try {
    const r = await fetch(`https://open.cnpja.com/cnpj/${clean}`);
    if (r.ok) {
      const d = await r.json() as Record<string, unknown>;
      return [mapCnpjaSearch(d)];
    }
  } catch { /* ignore */ }

  return [];
}

async function handleNameSearch(query: string, city?: string): Promise<Record<string, unknown>[]> {
  const q = encodeURIComponent(query.trim());
  const cityParam = city ? `&municipality=${encodeURIComponent(city)}` : '';

  // open.cnpja.com — busca por nome
  try {
    const url = `https://open.cnpja.com/company/search?query=${q}${cityParam}&limit=10`;
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (r.ok) {
      const d = await r.json() as Record<string, unknown>;
      const items = (d.companies || d.data || (Array.isArray(d) ? d : [])) as Array<Record<string, unknown>>;
      if (items.length > 0) return items.map(mapCnpjaSearch);
    }
  } catch { /* API indisponível */ }

  return [];
}

// ── Main ──────────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const body = await req.json() as { query?: string; cnpj?: string; city?: string };
    const { query, cnpj, city } = body;

    let results: Record<string, unknown>[] = [];

    if (cnpj) {
      results = await handleCNPJ(cnpj);
    } else if (query && query.trim().length >= 2) {
      results = await handleNameSearch(query.trim(), city);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ results: [], error: (err as Error).message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
