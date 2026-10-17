import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './authContext';
import { useRealtimeRefetch } from './useRealtimeRefetch';

function readLocalSettings(userId) {
  if (!userId || typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`backstage:user_settings:${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalSettings(userId, patch) {
  if (!userId || typeof window === 'undefined') return {};
  try {
    const current = readLocalSettings(userId);
    const next = { ...current, ...patch };
    window.localStorage.setItem(`backstage:user_settings:${userId}`, JSON.stringify(next));
    return next;
  } catch {
    return patch;
  }
}

export function useUserSettings() {
  const { user } = useAuth();
  const userId = user?.id;

  const [settings, setSettings] = useState(() => (userId ? readLocalSettings(userId) : null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    const localFallback = readLocalSettings(userId);
    try {
      const { data, error: err } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (err) throw err;
      const merged = { ...localFallback, ...(data || {}) };
      // Se o banco ainda tiver campos nulos que já foram salvos localmente, preserva o valor preenchido
      for (const k of Object.keys(localFallback)) {
        if ((merged[k] === null || merged[k] === undefined || merged[k] === '') && localFallback[k]) {
          merged[k] = localFallback[k];
        }
      }
      setSettings(merged);
    } catch (e) {
      setError(e.message);
      setSettings((prev) => ({ ...localFallback, ...(prev || {}) }));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  useRealtimeRefetch('user_settings', refetch);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upsert = useCallback(async (updates) => {
    if (!userId) throw new Error('Usuário não autenticado');
    const localSaved = writeLocalSettings(userId, updates);
    const payload = { ...updates, user_id: userId };
    delete payload.id;
    try {
      const { data, error: err } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();
      if (err) throw err;
      const merged = { ...localSaved, ...(data || {}), ...updates };
      setSettings(merged);
      return merged;
    } catch {
      // Caso a migration 039 ainda não tenha sido aplicada no Supabase remoto, mantém funcionando via localStorage
      setSettings((prev) => ({ ...(prev || {}), ...localSaved }));
      return { ...(settings || {}), ...localSaved };
    }
  }, [userId, settings]);

  return { settings, loading, error, refetch, upsert };
}
