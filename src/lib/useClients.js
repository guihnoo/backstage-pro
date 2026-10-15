import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';
import { useRealtimeRefetch } from './useRealtimeRefetch';
import { companyPatchFromClient, stripInheritedLogo, withCompanyLogo } from './companyEnrichment';
import { enrichCompanyById, upsertCompanyRecord } from './companyService';

/** Ficha pessoal + só o logo do catálogo (para mostrar quando a ficha não tem logo próprio). */
export const CLIENT_SELECT = '*, company:companies(logo_url)';

export async function linkClientToCompanyAfterCreate(client, userId) {
  if (!client || client.client_type === 'pessoa' || !userId) return client;

  let companyId = client.company_id || null;

  if (!companyId && client.name?.trim()) {
    try {
      const company = await upsertCompanyRecord(
        {
          name: client.name.trim(),
          trading_name: client.name.trim(),
          logo_url: client.logo_from_company ? null : client.logo_url,
          source: 'manual',
        },
        userId,
      );
      companyId = company?.id || null;
      if (companyId) {
        const { data: linked, error } = await supabase
          .from('clients')
          .update({ company_id: companyId })
          .eq('id', client.id)
          .select()
          .single();
        if (!error && linked) return linked;
      }
    } catch (e) {
      console.warn('Não foi possível vincular empresa global:', e.message);
    }
  }

  if (companyId) {
    const patch = companyPatchFromClient(client);
    if (patch) {
      try {
        await enrichCompanyById(companyId, patch);
      } catch (e) {
        console.warn('Não foi possível enriquecer empresa global:', e.message);
      }
    }
  }

  return companyId && !client.company_id ? { ...client, company_id: companyId } : client;
}

export function useClients() {
  const { user } = useAuth();
  const userId = user?.id;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const clientsRef = useRef(clients);
  clientsRef.current = clients;

  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('clients')
        .select(CLIENT_SELECT)
        .eq('user_id', userId)
        .order('name', { ascending: true });
      if (err) throw err;
      setClients((data || []).map(withCompanyLogo));
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  useRealtimeRefetch('clients', refetch);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (data) => {
    const payload = { ...stripInheritedLogo(data), user_id: userId };
    delete payload.owner_id;

    let { data: result, error: err } = await supabase
      .from('clients')
      .insert(payload)
      .select()
      .single();

    if (err && payload.client_type && /client_type/i.test(err.message || '')) {
      const fallback = { ...payload };
      delete fallback.client_type;
      ({ data: result, error: err } = await supabase
        .from('clients')
        .insert(fallback)
        .select()
        .single());
    }

    if (err) throw err;

    const enriched = await linkClientToCompanyAfterCreate(result, userId);
    setClients((prev) => [...prev, enriched].sort((a, b) => a.name.localeCompare(b.name)));
    return enriched;
  }, [userId]);

  const update = useCallback(async (id, data) => {
    const original = clientsRef.current.find((c) => c.id === id);
    const payload = stripInheritedLogo(data, original);
    delete payload.id;
    delete payload.user_id;
    delete payload.owner_id;
    const { data: row, error: err } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select(CLIENT_SELECT)
      .single();
    if (err) throw err;
    const result = withCompanyLogo(row);

    const companyId = result.company_id;
    const patch = companyPatchFromClient(result);
    if (companyId && patch) {
      enrichCompanyById(companyId, patch).catch((e) => {
        console.warn('Enriquecimento de empresa ignorado:', e.message);
      });
    } else if (!companyId && result.client_type !== 'pessoa' && result.name?.trim() && userId) {
      linkClientToCompanyAfterCreate(result, userId).catch(() => {});
    }

    setClients((prev) => prev.map((c) => (c.id === id ? result : c)));
    return result;
  }, [userId]);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase.from('clients').delete().eq('id', id);
    if (err) throw err;
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { clients, loading, error, refetch, create, update, delete: remove };
}
