import { useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';

/**
 * Banco global de empresas — compartilhado entre todos os usuários.
 * Qualquer usuário pode ler e contribuir. Só o criador edita/deleta.
 */
export function useCompanies() {
  const { user } = useAuth();

  /**
   * Busca empresas no banco compartilhado por nome ou trading_name.
   * Retorna até 10 resultados mais relevantes.
   */
  const searchLocal = useCallback(async (query) => {
    if (!query || query.trim().length < 2) return [];
    const q = `%${query.trim().toLowerCase()}%`;
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, trading_name, cnpj, city, state, phone, email, logo_url, source, verified')
      .or(`name.ilike.${q},trading_name.ilike.${q}`)
      .order('verified', { ascending: false })
      .order('name', { ascending: true })
      .limit(10);
    if (error) throw error;
    return data || [];
  }, []);

  /**
   * Busca por CNPJ exato no banco compartilhado.
   */
  const findByCNPJ = useCallback(async (cnpj) => {
    const clean = String(cnpj || '').replace(/\D/g, '');
    if (!clean) return null;
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('cnpj', clean)
      .maybeSingle();
    return data || null;
  }, []);

  /**
   * Cria ou atualiza empresa no banco compartilhado.
   * Se já existe pelo CNPJ, retorna a existente (não sobrescreve).
   * Se não tem CNPJ, sempre insere nova.
   */
  const upsertCompany = useCallback(async (companyData) => {
    if (!user?.id) throw new Error('Não autenticado');

    const clean = String(companyData.cnpj || '').replace(/\D/g, '');

    // Se tem CNPJ, verifica se já existe
    if (clean) {
      const existing = await findByCNPJ(clean);
      if (existing) return existing;
    }

    const payload = {
      name: companyData.name || companyData.razao_social || '',
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
      verified: companyData.source === 'brasilapi' || companyData.source === 'cnpja',
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('companies')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [user?.id, findByCNPJ]);

  return { searchLocal, findByCNPJ, upsertCompany };
}
