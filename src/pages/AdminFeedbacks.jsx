import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import {
  Inbox, Loader2, RefreshCw, Bug, Lightbulb, HelpCircle, Star,
  ChevronDown, ExternalLink, Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { isAppOwner } from '@/lib/isAppOwner';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { useOwnerFeedbacks, FEEDBACK_TYPES, FEEDBACK_STATUS } from '@/lib/useFeedback';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator';
import { Ellipsis } from '@/components/ui/overflowText';
import appToast from '@/lib/appToast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_ICONS = {
  bug: Bug,
  suggestion: Lightbulb,
  question: HelpCircle,
  praise: Star,
};

function FeedbackCard({ item, onUpdate, primaryHex }) {
  const [notes, setNotes] = useState(item.owner_notes || '');
  const [saving, setSaving] = useState(false);
  const TypeIcon = TYPE_ICONS[item.type] || Lightbulb;
  const statusMeta = FEEDBACK_STATUS[item.status] || FEEDBACK_STATUS.new;
  const statusColor = item.status === 'new' ? primaryHex : statusMeta.color;
  const typeLabel = FEEDBACK_TYPES.find((t) => t.id === item.type)?.label || item.type;

  const saveStatus = async (status) => {
    setSaving(true);
    try {
      await onUpdate(item.id, { status, owner_notes: notes || null });
      appToast.success('Atualizado');
    } catch (err) {
      appToast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await onUpdate(item.id, { owner_notes: notes || null });
      appToast.success('Notas salvas');
    } catch (err) {
      appToast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 space-y-3 min-w-0"
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${primaryHex}15`, border: `1px solid ${primaryHex}30` }}
          >
            <TypeIcon className="w-5 h-5" style={{ color: primaryHex }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                style={{ background: `${statusColor}20`, color: statusColor }}
              >
                {statusMeta.label}
              </span>
              <span className="text-[10px] text-slate-500">{typeLabel}</span>
              {item.rating && (
                <span className="text-[10px] text-amber-400">★ {item.rating}/5</span>
              )}
            </div>
            <Ellipsis as="p" className="text-sm font-semibold text-white">
              {item.user_email || 'Usuário'}
            </Ellipsis>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">
              {item.created_at
                ? format(parseISO(item.created_at), "d MMM yyyy · HH:mm", { locale: ptBR })
                : '—'}
              {item.page_path && ` · ${item.page_path}`}
            </p>
          </div>
        </div>
        <div className="relative shrink-0">
          <select
            value={item.status}
            disabled={saving}
            onChange={(e) => saveStatus(e.target.value)}
            className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-2 pr-7 py-1.5 text-xs text-white focus:outline-none"
            aria-label="Status do feedback"
          >
            {Object.entries(FEEDBACK_STATUS).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">{item.message}</p>

      {item.screenshot_url && (
        <a
          href={item.screenshot_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs bp-hover-primary transition-colors"
          style={{ color: primaryHex }}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Ver screenshot
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      <div className="pt-2 border-t border-slate-800/80">
        <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 block">
          Notas internas (só você vê)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ex.: corrigir na próxima release…"
          className="w-full bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 resize-none"
        />
        <button
          type="button"
          onClick={saveNotes}
          disabled={saving}
          className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          Salvar notas
        </button>
      </div>
    </motion.article>
  );
}

export default function AdminFeedbacks() {
  const { user, profile, loading: authLoading } = useAuth();
  const owner = isAppOwner(user, profile);
  const config = getCategoryConfig(profile?.category || 'lighting');
  const { items, loading, error, refetch, newCount, updateFeedback } = useOwnerFeedbacks(owner);

  const pullRefresh = async () => {
    await refetch();
    appToast.success('Inbox atualizada');
  };
  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(pullRefresh);

  const [filter, setFilter] = useState('all');

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!owner) {
    return <Navigate to="/" replace />;
  }

  const filtered =
    filter === 'all' ? items : items.filter((f) => f.status === filter);

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full pb-24">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={threshold}
        primaryHex={config.primaryHex}
      />

      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5" />
              Área exclusiva
            </p>
            <h1 className="text-2xl font-black text-white">Inbox de Feedback</h1>
            <p className="text-sm text-slate-500 mt-1">
              {newCount > 0 ? `${newCount} novo${newCount !== 1 ? 's' : ''}` : 'Nenhum feedback novo'}
            </p>
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white shrink-0"
            aria-label="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800/50 overflow-x-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'new', label: 'Novos' },
            { id: 'in_review', label: 'Em análise' },
            { id: 'resolved', label: 'Resolvidos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`flex-1 min-w-[4.5rem] py-2 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
            {error.message?.includes('permission') || error.message?.includes('policy')
              ? 'Sem permissão. Defina role = owner no seu perfil no Supabase (migration 029).'
              : error.message}
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-600 text-sm">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Nenhum feedback neste filtro
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                onUpdate={updateFeedback}
                primaryHex={config.primaryHex}
              />
            ))}
          </div>
        )}
      </div>
    </NeonPageShell>
  );
}
