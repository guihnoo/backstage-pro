import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, LogOut, Clock, Loader2 } from 'lucide-react';
import appToast from '@/lib/appToast';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import { todayLocalISO } from '@/components/utils/dateUtils';
import { computeWorkDay, REGIME_POR_DIA_ATIVO, defaultDayChoice } from '@/lib/workDay';

function nowTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

import { getCategoryConfig } from '@/lib/categoryConfig';
import { AUTH_HERO_CATEGORY } from '@/lib/categoryGear';

export default function ModoPalcoActions({ event, accentColor = getCategoryConfig(AUTH_HERO_CATEGORY).primaryHex, onRefresh }) {
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = todayLocalISO();

  const loadRecord = useCallback(async () => {
    if (!user?.id || !event?.id) {
      setRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_work')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', event.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      setRecord(data || null);
    } catch (err) {
      console.error('Erro ao carregar registro do dia:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, event?.id, today]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const handleEntry = async () => {
    if (!user?.id || !event?.id) return;
    setSaving(true);
    try {
      const entryTime = nowTimeString();
      const { data, error } = await supabase
        .from('daily_work')
        .insert({
          user_id: user.id,
          event_id: event.id,
          date: today,
          entry_time: entryTime,
          status: 'pending',
          total_hours: 0,
        })
        .select()
        .single();

      if (error) throw error;
      setRecord(data);
      appToast.success(`Entrada registrada às ${entryTime}`);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      appToast.error('Não foi possível registrar a entrada.');
    } finally {
      setSaving(false);
    }
  };

  const handleExit = async () => {
    if (!record?.id || !record.entry_time) return;
    setSaving(true);
    try {
      const exitTime = nowTimeString();
      // Regra única de horas e cachê (src/lib/workDay.js)
      const choice = defaultDayChoice(event, record);
      const day = computeWorkDay({
        event,
        entry: record.entry_time,
        exit: exitTime,
        ...(REGIME_POR_DIA_ATIVO ? { regime: choice.regime, horaExtra: choice.horaExtra } : {}),
      });
      const worked = { total: day.totalHours, overtime: day.overtimeHours };
      const cache = day.cache;

      const { data, error } = await supabase
        .from('daily_work')
        .update({
          exit_time: exitTime,
          total_hours: worked.total,
          overtime_hours: worked.overtime,
          daily_cache: cache,
          status: 'completed',
          ...(REGIME_POR_DIA_ATIVO
            ? { regime: choice.regime, hora_extra: choice.horaExtra, origem: 'lancada' }
            : {}),
        })
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;
      setRecord(data);
      appToast.success(`Saída às ${exitTime} · ${worked.total}h · R$ ${cache.toLocaleString('pt-BR')}`);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      appToast.error('Não foi possível registrar a saída.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-[#a8a8a8] text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando turno...
      </div>
    );
  }

  const hasEntry = Boolean(record?.entry_time);
  const hasExit = Boolean(record?.exit_time);
  const isCompleted = record?.status === 'completed' || hasExit;
  const totalH = record?.total_hours || record?.hours_worked;

  // Visual "All Access": um botão gigante por vez — CHEGUEI (amarelo) → BATER SAÍDA (rosa).
  return (
    <div className="rounded-2xl bg-[#161616] p-3">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <p className="font-tag text-[11px] font-bold tracking-[0.14em] text-[#a8a8a8] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
          TURNO DE HOJE
        </p>
        {hasEntry && (
          <p className="font-tag text-[11px] text-[#c8c8c8]">
            entrou {record.entry_time}
            {hasExit && <> · saiu {record.exit_time}{totalH > 0 ? ` · ${totalH}h` : ''}</>}
          </p>
        )}
      </div>

      {!hasEntry && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={saving}
          onClick={handleEntry}
          aria-label="Registrar entrada (cheguei)"
          className="w-full min-h-[64px] flex items-center justify-center gap-2 rounded-full font-poster text-[28px] tracking-[0.06em] disabled:opacity-50"
          style={{ background: '#ffd400', color: '#0a0a0a' }}
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" strokeWidth={2.6} />}
          CHEGUEI
        </motion.button>
      )}

      {hasEntry && !isCompleted && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={saving}
          onClick={handleExit}
          aria-label="Registrar saída (bater saída)"
          className="w-full min-h-[64px] flex items-center justify-center gap-2 rounded-full font-poster text-[28px] tracking-[0.06em] disabled:opacity-50"
          style={{ background: '#ff2e88', color: '#0a0a0a' }}
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogOut className="w-6 h-6" strokeWidth={2.6} />}
          BATER SAÍDA
        </motion.button>
      )}

      {isCompleted && (
        <p className="text-center font-poster text-xl tracking-wide text-[#ffd400] py-3">
          TURNO ENCERRADO — BOM SHOW!
        </p>
      )}
    </div>
  );
}
