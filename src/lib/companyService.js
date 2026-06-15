import { supabase } from './supabase';
import {
  buildCompanyPatchDiff,
  mergeCompanyRecord,
  normalizeCompanyKey,
} from './companyEnrichment';

export async function searchCompaniesLocal(query, limit = 10) {
  if (!query || query.trim().length < 2) return [];
  const q = `%${query.trim()}%`;
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, trading_name, cnpj, city, state, phone, email, logo_url, website, source, verified')
    .or(`name.ilike.${q},trading_name.ilike.${q}`)
    .order('verified', { ascending: false })
    .order('name', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function findCompanyByCNPJ(cnpj) {
  const clean = String(cnpj || '').replace(/\D/g, '');
  if (!clean) return null;
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('cnpj', clean)
    .maybeSingle();
  return data || null;
}

export async function findCompanyByName(name) {
  const trimmed = String(name || '').trim();
  if (trimmed.length < 2) return null;
  const key = normalizeCompanyKey(trimmed);
  const q = `%${trimmed}%`;
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .or(`name.ilike.${q},trading_name.ilike.${q}`)
    .limit(25);
  if (error) throw error;
  return (
    (data || []).find((c) => {
      const names = [c.trading_name, c.name].filter(Boolean).map(normalizeCompanyKey);
      return names.includes(key);
    }) || null
  );
}

export async function enrichCompanyById(companyId, patch) {
  if (!companyId || !patch) return null;
  const { data: existing, error: readErr } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!existing) return null;

  const merged = mergeCompanyRecord(existing, patch);
  const diff = buildCompanyPatchDiff(existing, merged);
  if (Object.keys(diff).length === 0) return existing;

  const { data, error } = await supabase
    .from('companies')
    .update(diff)
    .eq('id', companyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertCompanyRecord(companyData, userId) {
  if (!userId) throw new Error('Não autenticado');

  const clean = String(companyData.cnpj || '').replace(/\D/g, '');
  let existing = clean ? await findCompanyByCNPJ(clean) : null;
  if (!existing) {
    existing = await findCompanyByName(companyData.trading_name || companyData.name);
  }

  if (existing) {
    const merged = mergeCompanyRecord(existing, companyData);
    const diff = buildCompanyPatchDiff(existing, merged);
    if (Object.keys(diff).length === 0) return existing;
    const { data, error } = await supabase
      .from('companies')
      .update(diff)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const payload = {
    name: companyData.name || companyData.razao_social || companyData.trading_name || '',
    trading_name: companyData.trading_name || null,
    cnpj: clean || null,
    city: companyData.city || null,
    state: companyData.state || null,
    address: companyData.address || null,
    phone: companyData.phone || null,
    email: companyData.email || null,
    website: companyData.website || null,
    logo_url: companyData.logo_url || null,
    cnae: companyData.cnae || null,
    porte: companyData.porte || null,
    status: companyData.status || 'ativa',
    source: companyData.source || 'manual',
    verified: companyData.verified === true || companyData.source === 'brasilapi' || companyData.source === 'cnpja',
    created_by: userId,
  };

  if (!payload.name?.trim()) {
    throw new Error('Nome da empresa é obrigatório');
  }

  const { data, error } = await supabase
    .from('companies')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}
