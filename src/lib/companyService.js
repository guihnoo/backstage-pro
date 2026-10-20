import { supabase } from './supabase';
import {
  buildCompanyPatchDiff,
  buildCompanySuggestions,
  mergeCompanyRecord,
  normalizeCompanyKey,
} from './companyEnrichment';

/**
 * Envia sugestões de correção do catálogo para o dono aprovar. Nunca altera a empresa.
 * Falhas são ignoradas (tabela ainda não criada, sugestão repetida etc.).
 */
export async function submitCompanySuggestions(suggestions) {
  if (!suggestions?.length) return;
  for (const s of suggestions) {
    try {
      const { error } = await supabase.from('company_suggestions').insert(s);
      if (error && error.code !== '23505') console.warn('Sugestão de empresa ignorada:', error.message);
    } catch (e) {
      console.warn('Sugestão de empresa ignorada:', e.message);
    }
  }
}

/** Fila e histórico do catálogo (só o dono do app consegue ler). */
export async function listCompanySuggestions(status = 'pendente') {
  const { data, error } = await supabase
    .from('company_suggestions')
    .select('id, company_id, suggested_by, field, current_value, suggested_value, status, created_at, reviewed_at, company:companies(name, trading_name, logo_url)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function listCompanyChanges(limit = 200) {
  const { data, error } = await supabase
    .from('company_changes')
    .select('id, company_id, changed_by, changed_at, action, field, old_value, new_value')
    .order('changed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function reviewCompanySuggestion(id, approve) {
  const { error } = await supabase.rpc('revisar_sugestao_empresa', { p_id: id, p_aprovar: approve });
  if (error) throw error;
}

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

  await submitCompanySuggestions(buildCompanySuggestions(existing, patch));

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
