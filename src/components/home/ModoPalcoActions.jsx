import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, LogOut, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import { todayLocalISO } from '@/components/utils/dateUtils';

function nowTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function calculateHours(entry, exit) {
  if (!entry || !exit) return { total: 0, overtime: 0 };
  const [entryH, entryM] = entry.split(':').map(Number);
  const [exitH, exitM] = exit.split(':').map(Number);
  let entryMinutes = entryH * 60 + entryM;
  let exitMinutes = exitH * 60 + exitM;
  if (exitMinutes < entryMinutes) exitMinutes += 24 * 60;
  const total = (exitMinutes - entryMinutes) / 60;
  const overtime = Math.max(0, total - 12);
  return {
    total: Math.round(total * 10) / 10,
    overtime: Math.round(overtime * 10) / 10,
  };
}

function calculateCache(event, totalHours, overtimeHours) {
  if (!event) return 0;
  const baseValue = Number(event.daily_cache_value || event.estimated_revenue || 0);
  const paymentModel = event.payment_model || 'HORAS_EXTRAS';
  if (paymentModel === 'MEIO_CACHE_E_DOBRA') {
    const base = Number(event.cache_valor_base || baseValue);
    if (totalHours <= 6) return Math.round((base / 2) * 100) / 100;
    if (totalHours <= 12) return Math.round(baseValue * 100) / 100;
    return Math.round(base * 2 * 100) / 100;
  }
  const overtimeRate = baseValue / 12;
  return Math.round((baseValue + overtimeHours * overtimeRate) * 100) / 100;
}

export default function ModoPalcoActions({ event, accentColor = '#00D9FF', onRefresh }) {
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
      toast.success(`Entrada registrada às ${entryTime}`);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível registrar a entrada.');
    } finally {
      setSaving(false);
    }
  };

  const handleExit = async () => {
    if (!record?.id || !record.entry_time) return;
    setSaving(true);
    try {
      const exitTime = nowTimeString();
      const worked = calculateHours(record.entry_time, exitTime);
      const cache = calculateCache(event, worked.total, worked.overtime);

      const { data, error } = await supabase
        .from('daily_work')
        .update({
          exit_time: exitTime,
          total_hours: worked.total,
          overtime_hours: worked.overtime,
          daily_cache: cache,
          status: 'completed',
        })
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;
      setRecord(data);
      toast.success(`Saída às ${exitTime} · ${worked.total}h · R$ ${cache.toLocaleString('pt-BR')}`);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível registrar a saída.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-slate-500 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando turno...
      </div>
    );
  }

  const hasEntry = Boolean(record?.entry_time);
  const hasExit = Boolean(record?.exit_time);
  const isCompleted = record?.status === 'completed' || hasExit;

  return (
    <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
        Registro de turno
      </p>

      {hasEntry && (
        <div className="flex flex-wrap gap-3 text-sm text-slate-300 mb-4">
          <span>
            Entrada: <strong className="text-white">{record.entry_time}</strong>
          </span>
          {hasExit && (
            <span>
              Saída: <strong className="text-white">{record.exit_time}</strong>
              {(record.total_hours || record.hours_worked) > 0 && (
                <span className="text-slate-500 ml-1">
                  ({record.total_hours || record.hours_worked}h)
                </span>
              )}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {!hasEntry && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={saving}
            onClick={handleEntry}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
              boxShadow: `0 0 20px ${accentColor}40`,
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Registrar Entrada
          </motion.button>
        )}

        {hasEntry && !isCompleted && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={saving}
            onClick={handleExit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Registrar Saída
          </motion.button>
        )}

        {isCompleted && (
          <p className="flex-1 text-center text-sm text-emerald-400 font-medium py-3">
            Turno encerrado — bom trabalho no palco!
          </p>
        )}
      </div>
    </div>
  );
}
