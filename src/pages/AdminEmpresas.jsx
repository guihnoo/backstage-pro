import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Building2, Check, Loader2, RefreshCw, X, History, ListChecks } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/lib/authContext';
import { isAppOwner } from '@/lib/isAppOwner';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { supabase } from '@/lib/supabase';
import {
  listCompanyChanges,
  listCompanySuggestions,
  reviewCompanySuggestion,
} from '@/lib/companyService';
import appToast from '@/lib/appToast';

const FIELD_LABELS = {
  name: 'Razão social',
  trading_name: 'Nome',
  cnpj: 'CNPJ',
  logo_url: 'Logo',
  city: 'Cidade',
  state: 'UF',
  address: 'Endereço',
  phone: 'Telefone',
  email: 'E-mail',
  website: 'Site',
  cnae: 'CNAE',
  porte: 'Porte',
  status: 'Situação',
  source: 'Origem',
  verified: 'Verificada',
};

const ACTION_LABELS = {
  criou: 'cadastrou',
  preencheu: 'preencheu',
  alterou: 'alterou',
  aprovou_sugestao: 'aprovou sugestão em',
};

function fmtDate(iso) {
  try {
    return format(parseISO(iso), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso || '';
  }
}

function Value({ field, value }) {
  if (value == null || value === '') return <span className="text-slate-600">vazio</span>;
  if (field === 'logo_url') {
    return <img src={value} alt="" className="w-10 h-10 rounded bg-white object-contain p-0.5 inline-block" />;
  }
  return <span className="break-all">{String(value)}</span>;
}

async function fetchNames(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data, error } = await supabase.rpc('nomes_usuarios_para_dono', { p_ids: unique });
  if (error) return {};
  return Object.fromEntries((data || []).map((u) => [u.id, u.nome || u.email || 'Usuário']));
}

async function fetchCompanyNames(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data } = await supabase.from('companies').select('id, name, trading_name').in('id', unique);
  return Object.fromEntries((data || []).map((c) => [c.id, c.trading_name || c.name]));
}

export default function AdminEmpresas() {
  const { user, profile, loading: authLoading } = useAuth();
  const owner = isAppOwner(user, profile);
  const config = getCategoryConfig(profile?.category || 'lighting');

  const [tab, setTab] = useState('sugestoes');
  const [suggestions, setSuggestions] = useState([]);
  const [changes, setChanges] = useState([]);
  const [names, setNames] = useState({});
  const [companyNames, setCompanyNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!owner) return;
    setLoading(true);
    setError(null);
    try {
      const [sug, hist] = await Promise.all([listCompanySuggestions('pendente'), listCompanyChanges(200)]);
      setSuggestions(sug);
      setChanges(hist);
      const [n, cn] = await Promise.all([
        fetchNames([...sug.map((s) => s.suggested_by), ...hist.map((h) => h.changed_by)]),
        fetchCompanyNames(hist.map((h) => h.company_id)),
      ]);
      setNames(n);
      setCompanyNames(cn);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => { load(); }, [load]);

  const review = async (id, approve) => {
    setBusyId(id);
    try {
      await reviewCompanySuggestion(id, approve);
      appToast.success(approve ? 'Sugestão aprovada' : 'Sugestão recusada');
      await load();
    } catch (e) {
      appToast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || (user && !profile)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!owner) return <Navigate to="/" replace />;

  const who = (id) => names[id] || (id ? 'Usuário' : 'Sistema');

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex} className="min-h-full pb-24">
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Área exclusiva
            </p>
            <h1 className="text-2xl font-black text-white">Catálogo de empresas</h1>
            <p className="text-sm text-slate-500 mt-1">
              {suggestions.length > 0
                ? `${suggestions.length} sugest${suggestions.length !== 1 ? 'ões' : 'ão'} para revisar`
                : 'Nenhuma sugestão pendente'}
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white shrink-0"
            aria-label="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800/50">
          {[
            { id: 'sugestoes', label: 'Sugestões', icon: ListChecks },
            { id: 'historico', label: 'Histórico', icon: History },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === t.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-amber-400 border border-amber-500/30 rounded-xl p-3">
            Não foi possível carregar: {error}
          </p>
        )}

        {tab === 'sugestoes' && (
          <div className="space-y-3">
            {!loading && suggestions.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">Tudo revisado.</p>
            )}
            {suggestions.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="text-sm text-slate-300">
                  <span className="font-semibold text-white">{who(s.suggested_by)}</span> sugere trocar{' '}
                  <span className="font-semibold">{FIELD_LABELS[s.field] || s.field}</span> de{' '}
                  <span className="font-semibold text-white">{s.company?.trading_name || s.company?.name || 'empresa'}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{fmtDate(s.created_at)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase text-slate-500 mb-1">Atual</p>
                    <Value field={s.field} value={s.current_value} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase text-slate-500 mb-1">Sugerido</p>
                    <Value field={s.field} value={s.suggested_value} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === s.id}
                    onClick={() => review(s.id, true)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600/90 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> Aprovar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === s.id}
                    onClick={() => review(s.id, false)}
                    className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'historico' && (
          <ul className="space-y-2">
            {!loading && changes.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">Nenhuma mudança registrada ainda.</p>
            )}
            {changes.map((h) => (
              <li key={h.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-white">{who(h.changed_by)}</span>{' '}
                  {ACTION_LABELS[h.action] || h.action}{' '}
                  {h.action !== 'criou' && <span className="font-semibold">{FIELD_LABELS[h.field] || h.field}</span>}{' '}
                  {h.action !== 'criou' ? 'de ' : ''}
                  <span className="font-semibold text-white">{companyNames[h.company_id] || 'empresa'}</span>
                </p>
                <p className="text-xs text-slate-500">{fmtDate(h.changed_at)}</p>
                {h.action !== 'criou' && (
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    <Value field={h.field} value={h.old_value} />
                    <span className="text-slate-600">→</span>
                    <Value field={h.field} value={h.new_value} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </NeonPageShell>
  );
}
