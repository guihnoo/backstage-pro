import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Search, Building2, MapPin, CheckCircle2, Loader2,
  X, Globe, Sparkles, AlertCircle, ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useCompanies } from '@/lib/useCompanies';
import { formatCNPJ, looksLikeCNPJ, cleanCNPJ } from '@/lib/cnpjSearch';

// ── Logo com fallback ────────────────────────────────────────────────────────

function CompanyLogo({ domain, name, size = 'md' }) {
  const [ok, setOk] = useState(!!domain);
  const sz = size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  const icon = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  const initial = (name || '?')[0].toUpperCase();

  if (ok && domain) {
    return (
      <div className={`${sz} rounded-xl border border-slate-700 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={name}
          className="w-full h-full object-contain p-1"
          onError={() => setOk(false)}
        />
      </div>
    );
  }

  return (
    <div className={`${sz} rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center flex-shrink-0`}>
      <span className="text-slate-300 font-bold text-base">{initial}</span>
    </div>
  );
}

// ── Card de resultado ─────────────────────────────────────────────────────────

function CompanyCard({ company, onSelect }) {
  const displayName = company.trading_name || company.name || '';
  const razao = company.trading_name && company.razao_social && company.razao_social !== company.trading_name
    ? company.razao_social
    : null;
  const location = [company.city, company.state].filter(Boolean).join(' / ');
  const cnpjFmt  = company.cnpj ? formatCNPJ(company.cnpj) : null;
  const isInactive = company.status && !['ativa', 'Ativa', 'ATIVA'].includes(company.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer overflow-hidden"
      onClick={() => onSelect(company)}
    >
      {/* Barra lateral colorida */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-500/0 group-hover:bg-cyan-500/60 transition-colors" />

      <div className="flex items-start gap-3 p-3.5">
        {/* Logo */}
        <CompanyLogo domain={company.domain} name={displayName} size="md" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{displayName}</p>
              {razao && (
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{razao}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {company.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" title="Dados verificados (Receita Federal)" />
              )}
              {isInactive && (
                <Badge className="text-[9px] h-4 px-1.5 bg-red-500/20 text-red-300 border-red-500/30">
                  {company.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {location && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                {location}
              </span>
            )}
            {cnpjFmt && (
              <span className="text-[11px] text-slate-500 font-mono">{cnpjFmt}</span>
            )}
            {company.cnae && (
              <span className="text-[11px] text-slate-500 truncate max-w-[180px]">{company.cnae}</span>
            )}
          </div>

          {(company.phone || company.email || company.website) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
              {company.phone && (
                <span className="text-[11px] text-slate-400">{company.phone}</span>
              )}
              {company.email && (
                <span className="text-[11px] text-slate-400 truncate max-w-[160px]">{company.email}</span>
              )}
              {company.website && (
                <span className="flex items-center gap-0.5 text-[11px] text-cyan-500">
                  <Globe className="w-3 h-3" />
                  {company.domain}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Selecionar */}
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function CompanySearchInput({ onSelect, disabled }) {
  const [query,   setQuery]   = useState('');
  const [city,    setCity]    = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error,   setError]   = useState('');

  const { searchLocal } = useCompanies();
  const abortRef = useRef(null);

  // Busca ao pressionar Enter ou botão
  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError('');
    setResults([]);
    setSearched(false);

    try {
      const isCNPJ = looksLikeCNPJ(q);
      const payload = isCNPJ
        ? { cnpj: cleanCNPJ(q) }
        : { query: q, city: city.trim() || undefined };

      // Busca paralela: banco local + Edge Function
      const [localResults, edgeResult] = await Promise.allSettled([
        searchLocal(q),
        supabase.functions.invoke('search-company', { body: payload }),
      ]);

      const local   = localResults.status === 'fulfilled' ? localResults.value : [];
      const external = edgeResult.status === 'fulfilled'
        ? (edgeResult.value.data?.results || [])
        : [];

      // Remove duplicatas (CNPJ igual)
      const localCNPJs = new Set(local.map(c => c.cnpj).filter(Boolean));
      const merged = [
        ...local.map(c => ({ ...c, _origin: 'local' })),
        ...external
          .filter(c => !c.cnpj || !localCNPJs.has(c.cnpj))
          .map(c => ({ ...c, _origin: 'api' })),
      ];

      setResults(merged);
      setSearched(true);

      if (merged.length === 0 && edgeResult.status === 'rejected') {
        setError('Serviço de busca indisponível. Use o CNPJ ou preencha manualmente.');
      }
    } finally {
      setLoading(false);
    }
  }, [query, city, searchLocal]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runSearch(); }
  };

  const handleSelect = async (company) => {
    // Se resultado parcial da API (só o search, sem detalhes completos), busca o CNPJ completo
    let full = company;
    if (company._origin === 'api' && company._partial && company.cnpj) {
      setLoading(true);
      try {
        const { data } = await supabase.functions.invoke('search-company', {
          body: { cnpj: company.cnpj },
        });
        if (data?.results?.[0]) full = { ...data.results[0], _origin: 'api' };
      } catch { /* usa parcial */ }
      setLoading(false);
    }

    setSelected(full);
    setQuery('');
    setCity('');
    setResults([]);
    setSearched(false);
    onSelect(full);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setCity('');
    setResults([]);
    setSearched(false);
    setError('');
    onSelect(null);
  };

  // ── Se empresa já selecionada ────────────────────────────────────────────
  if (selected) {
    const displayName = selected.trading_name || selected.name || '';
    const location = [selected.city, selected.state].filter(Boolean).join(' / ');
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30"
      >
        <CompanyLogo domain={selected.domain} name={displayName} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {location && <span className="text-[11px] text-slate-400">{location}</span>}
            {selected.cnpj && <span className="text-[11px] text-slate-500 font-mono">{formatCNPJ(selected.cnpj)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <button
            type="button"
            onClick={handleClear}
            className="w-7 h-7 rounded-full hover:bg-slate-700 flex items-center justify-center transition-colors"
            title="Remover seleção"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Formulário de busca ─────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Campos de pesquisa */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); setSearched(false); }}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            placeholder="Nome da empresa ou CNPJ…"
            className="pl-10 bg-slate-800/80 border-slate-600 text-white h-11 text-sm focus:border-cyan-500"
          />
        </div>
        <div className="relative w-32">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            placeholder="Cidade"
            className="pl-8 bg-slate-800/80 border-slate-600 text-white h-11 text-sm focus:border-cyan-500"
          />
        </div>
        <Button
          type="button"
          onClick={runSearch}
          disabled={disabled || loading || query.trim().length < 2}
          className="h-11 px-4 bg-cyan-600 hover:bg-cyan-700 text-white flex-shrink-0"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Search className="w-4 h-4" />
          }
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Resultados */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {/* Grupo local */}
            {results.filter(r => r._origin === 'local').length > 0 && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-500 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Já cadastradas no Backstage Pro
                </p>
                <div className="space-y-2">
                  {results.filter(r => r._origin === 'local').map((c, i) => (
                    <CompanyCard key={c.cnpj || c.id || i} company={c} onSelect={handleSelect} />
                  ))}
                </div>
              </div>
            )}

            {/* Grupo API */}
            {results.filter(r => r._origin === 'api').length > 0 && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-green-400 mb-1.5 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Receita Federal
                </p>
                <div className="space-y-2">
                  {results.filter(r => r._origin === 'api').map((c, i) => (
                    <CompanyCard key={c.cnpj || i} company={c} onSelect={handleSelect} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Nenhum resultado */}
        {searched && results.length === 0 && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 py-6 text-center"
          >
            <Building2 className="w-10 h-10 text-slate-700" />
            <p className="text-sm text-slate-400">Empresa não encontrada</p>
            <p className="text-xs text-slate-600">Tente pelo CNPJ, ou preencha os campos manualmente abaixo.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
