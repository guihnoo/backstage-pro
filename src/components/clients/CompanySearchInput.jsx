import { useState, useRef, useCallback } from 'react';
import {
  Search, Building2, MapPin, CheckCircle2, Loader2,
  X, Globe, Sparkles, AlertCircle, ChevronRight,
  Hash, FileUp, FileText, User, RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useCompanies } from '@/lib/useCompanies';
import { formatCNPJ, looksLikeCNPJ, cleanCNPJ } from '@/lib/cnpjSearch';
import CompanyAvatar from './CompanyAvatar';

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function parseNFeXML(xmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    if (doc.querySelector('parsererror')) return null;

    function extractFromNode(node) {
      if (!node) return null;
      const cnpj = node.querySelector('CNPJ')?.textContent?.trim() || null;
      const cpf  = node.querySelector('CPF')?.textContent?.trim() || null;
      const xNome = node.querySelector('xNome')?.textContent?.trim() || '';
      const xFant = node.querySelector('xFant')?.textContent?.trim() || null;
      const fone  = node.querySelector('fone')?.textContent?.replace(/\D/g, '') || null;
      const email = node.querySelector('email')?.textContent?.trim() || null;
      const xMun  = node.querySelector('xMun')?.textContent?.trim() || '';
      const UF    = node.querySelector('UF')?.textContent?.trim() || '';
      const xLgr  = node.querySelector('xLgr')?.textContent?.trim() || '';
      const nro   = node.querySelector('nro')?.textContent?.trim() || '';
      const xBairro = node.querySelector('xBairro')?.textContent?.trim() || '';
      const CEP   = node.querySelector('CEP')?.textContent?.trim() || '';
      if (!xNome && !cnpj) return null;
      const phone = fone
        ? fone.length >= 11 ? `(${fone.slice(0,2)}) ${fone.slice(2,7)}-${fone.slice(7)}`
          : fone.length >= 10 ? `(${fone.slice(0,2)}) ${fone.slice(2,6)}-${fone.slice(6)}`
          : fone
        : null;
      const address = [xLgr, nro, xBairro, xMun, UF,
        CEP ? CEP.replace(/(\d{5})(\d{3})/, '$1-$2') : ''].filter(Boolean).join(', ');
      return {
        cnpj: cnpj ? cleanCNPJ(cnpj) : null,
        cpf: cpf || null,
        name: xFant || xNome,
        trading_name: xFant || null,
        razao_social: xNome,
        city: xMun,
        state: UF,
        address,
        phone,
        email,
        source: 'nfe',
        verified: false,
        _fromNFe: true,
      };
    }

    const dest = doc.querySelector('dest');
    const emit = doc.querySelector('emit');
    return {
      dest: extractFromNode(dest),
      emit: extractFromNode(emit),
    };
  } catch {
    return null;
  }
}

// ── Card de resultado ─────────────────────────────────────────────────────────

function CompanyCard({ company, onSelect, sourceBadge }) {
  const displayName = company.trading_name || company.name || '';
  const razao = company.razao_social && company.razao_social !== displayName
    ? company.razao_social
    : (company.trading_name && company.name && company.trading_name !== company.name ? company.name : null);
  const location = [company.city, company.state].filter(Boolean).join(' / ');
  const cnpjFmt  = company.cnpj ? formatCNPJ(company.cnpj) : null;
  const isInactive = company.status && !['ativa', 'Ativa', 'ATIVA'].includes(company.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 transition-all cursor-pointer overflow-hidden hover:border-[color-mix(in_srgb,var(--bp-primary)_40%,transparent)]"
      onClick={() => onSelect(company)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-60 transition-opacity bg-[var(--bp-primary)]" />

      <div className="flex items-start gap-3 p-3.5">
        <CompanyAvatar company={company} name={displayName} size="md" className="rounded-xl border-slate-700" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{displayName}</p>
              {razao && (
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  <span className="text-slate-600">Razão Social: </span>{razao}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {company.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 bp-text-primary" title="Dados verificados (Receita Federal)" />
              )}
              {sourceBadge && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border" style={sourceBadge.style}>
                  {sourceBadge.label}
                </span>
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
                <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />{location}
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
              {company.phone && <span className="text-[11px] text-slate-400">{company.phone}</span>}
              {company.email && <span className="text-[11px] text-slate-400 truncate max-w-[160px]">{company.email}</span>}
              {company.website && (
                <span className="flex items-center gap-0.5 text-[11px] bp-text-primary">
                  <Globe className="w-3 h-3" />{company.domain}
                </span>
              )}
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[var(--bp-primary)] transition-colors flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

// ── Empresa selecionada (estado compacto) ─────────────────────────────────────

function SelectedCompany({ company, onClear }) {
  const displayName = company.trading_name || company.name || '';
  const razao = company.razao_social && company.razao_social !== displayName ? company.razao_social : null;
  const location = [company.city, company.state].filter(Boolean).join(' / ');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl bp-today-surface-soft border overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
        <CompanyAvatar company={company} name={displayName} size="md" className="rounded-xl border-slate-700" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          {razao && (
            <p className="text-[11px] text-slate-400 truncate">
              <span className="text-slate-500">Razão: </span>{razao}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {location && <span className="text-[11px] text-slate-500">{location}</span>}
            {company.cnpj && <span className="text-[11px] text-slate-600 font-mono">{formatCNPJ(company.cnpj)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 bp-text-primary" />
          <button
            type="button"
            onClick={onClear}
            className="w-7 h-7 rounded-full hover:bg-slate-700 flex items-center justify-center transition-colors"
            title="Remover seleção"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Linha de razão social + nome fantasia destaque */}
      {(razao || company.cnpj) && (
        <div className="border-t border-[color-mix(in_srgb,var(--bp-primary)_15%,transparent)] px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
          {company.trading_name && (
            <span className="text-[10px] text-slate-500">
              <span className="text-slate-600">Nome Fantasia: </span>
              <span className="bp-text-primary font-semibold">{company.trading_name}</span>
            </span>
          )}
          {razao && (
            <span className="text-[10px] text-slate-500">
              <span className="text-slate-600">Razão Social: </span>
              <span className="text-slate-300">{razao}</span>
            </span>
          )}
          {company.cnpj && (
            <span className="text-[10px] text-slate-500 font-mono">
              <span className="text-slate-600">CNPJ: </span>{formatCNPJ(company.cnpj)}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

const TABS = [
  { id: 'search', label: 'Pesquisar', icon: Search },
  { id: 'cnpj',   label: 'CNPJ',     icon: Hash },
  { id: 'nfe',    label: 'NF-e XML', icon: FileText },
];

export default function CompanySearchInput({ onSelect, disabled }) {
  const [tab, setTab]         = useState('search');
  const [selected, setSelected] = useState(null);

  // ── Tab: Pesquisar
  const [query,    setQuery]   = useState('');
  const [city,     setCity]    = useState('');
  const [results,  setResults] = useState([]);
  const [loading,  setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error,    setError]   = useState('');

  // ── Tab: CNPJ
  const [cnpjInput,    setCnpjInput]   = useState('');
  const [cnpjLoading,  setCnpjLoading] = useState(false);
  const [cnpjResult,   setCnpjResult]  = useState(null);
  const [cnpjError,    setCnpjError]   = useState('');

  // ── Tab: NF-e
  const [nfeData,    setNfeData]    = useState(null); // { dest, emit }
  const [nfeParsing, setNfeParsing] = useState(false);
  const [nfeError,   setNfeError]   = useState('');
  const fileRef = useRef(null);

  const { searchLocal } = useCompanies();
  const abortRef = useRef(null);

  // ── Busca por nome ────────────────────────────────────────────────────────

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
        : { query: stripAccents(q), city: city.trim() || undefined };

      const [localRes, edgeRes] = await Promise.allSettled([
        searchLocal(q),
        supabase.functions.invoke('search-company', { body: payload }),
      ]);

      const local    = localRes.status === 'fulfilled' ? localRes.value : [];
      const external = edgeRes.status === 'fulfilled'
        ? (edgeRes.value.data?.results || [])
        : [];

      const localCNPJs = new Set(local.map(c => c.cnpj).filter(Boolean));
      const merged = [
        ...local.map(c => ({ ...c, _origin: 'local' })),
        ...external
          .filter(c => !c.cnpj || !localCNPJs.has(c.cnpj))
          .map(c => ({ ...c, _origin: 'api' })),
      ];

      setResults(merged);
      setSearched(true);

      if (merged.length === 0 && edgeRes.status === 'rejected') {
        setError('Serviço de busca indisponível. Use o CNPJ ou importe a NF-e.');
      }
    } finally {
      setLoading(false);
    }
  }, [query, city, searchLocal]);

  // ── Busca por CNPJ ────────────────────────────────────────────────────────

  const runCNPJSearch = async () => {
    const clean = cleanCNPJ(cnpjInput);
    if (clean.length !== 14) {
      setCnpjError('CNPJ inválido. Digite os 14 dígitos.');
      return;
    }
    setCnpjLoading(true);
    setCnpjError('');
    setCnpjResult(null);
    try {
      const { data, error: err } = await supabase.functions.invoke('search-company', {
        body: { cnpj: clean },
      });
      if (err || !data?.results?.length) {
        setCnpjError('CNPJ não encontrado. Verifique o número ou preencha manualmente.');
      } else {
        setCnpjResult(data.results[0]);
      }
    } catch {
      setCnpjError('Erro ao consultar CNPJ. Tente novamente.');
    } finally {
      setCnpjLoading(false);
    }
  };

  // ── Importar NF-e XML ─────────────────────────────────────────────────────

  const handleNFeFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNfeParsing(true);
    setNfeError('');
    setNfeData(null);
    try {
      const text = await file.text();
      const parsed = parseNFeXML(text);
      if (!parsed || (!parsed.dest && !parsed.emit)) {
        setNfeError('Não foi possível ler o arquivo. Certifique-se de usar um XML de NF-e válido.');
      } else {
        setNfeData(parsed);
      }
    } catch {
      setNfeError('Erro ao ler o arquivo XML.');
    } finally {
      setNfeParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── Selecionar empresa ────────────────────────────────────────────────────

  const handleSelect = async (company) => {
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
    setResults([]);
    setSearched(false);
    setCnpjResult(null);
    setNfeData(null);
    onSelect(full);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setCity('');
    setResults([]);
    setSearched(false);
    setError('');
    setCnpjInput('');
    setCnpjResult(null);
    setCnpjError('');
    setNfeData(null);
    setNfeError('');
    onSelect(null);
  };

  // ── Formatação de CNPJ no input ───────────────────────────────────────────

  const handleCNPJInput = (v) => {
    const nums = v.replace(/\D/g, '').slice(0, 14);
    let fmt = nums;
    if (nums.length > 12) fmt = `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5,8)}/${nums.slice(8,12)}-${nums.slice(12)}`;
    else if (nums.length > 8) fmt = `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5,8)}/${nums.slice(8)}`;
    else if (nums.length > 5) fmt = `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5)}`;
    else if (nums.length > 2) fmt = `${nums.slice(0,2)}.${nums.slice(2)}`;
    setCnpjInput(fmt);
    setCnpjError('');
    setCnpjResult(null);
  };

  // ── Empresa já selecionada ────────────────────────────────────────────────

  if (selected) {
    return <SelectedCompany company={selected} onClear={handleClear} />;
  }

  // ── Formulário ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Abas */}
      <div className="flex gap-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              disabled={disabled}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Tab: Pesquisar ─────────────────────────────────────────── */}
        {tab === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSearched(false); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), runSearch())}
                  disabled={disabled || loading}
                  placeholder="Nome da empresa…"
                  className="pl-10 bg-slate-800/80 border-slate-600 text-white h-11 text-sm bp-focus-input"
                />
              </div>
              <div className="relative w-32">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <Input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), runSearch())}
                  disabled={disabled || loading}
                  placeholder="Cidade"
                  className="pl-8 bg-slate-800/80 border-slate-600 text-white h-11 text-sm bp-focus-input"
                />
              </div>
              <Button
                type="button"
                onClick={runSearch}
                disabled={disabled || loading || query.trim().length < 2}
                className="h-11 px-4 text-white flex-shrink-0 hover:opacity-90"
                style={{ backgroundColor: 'var(--bp-primary)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <p className="text-[10px] text-slate-600">
              Dica: se não encontrar pelo nome, use a aba <strong className="text-slate-500">CNPJ</strong> com o número do cartão CNPJ ou NF.
            </p>

            {error && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <AnimatePresence>
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  {results.filter(r => r._origin === 'local').length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider bp-text-primary mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Já cadastradas no Backstage Pro
                      </p>
                      <div className="space-y-2">
                        {results.filter(r => r._origin === 'local').map((c, i) => (
                          <CompanyCard key={c.cnpj || c.id || i} company={c} onSelect={handleSelect} />
                        ))}
                      </div>
                    </div>
                  )}
                  {results.filter(r => r._origin === 'api').length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-green-400 mb-1.5 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Receita Federal
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

              {searched && results.length === 0 && !loading && !error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 py-5 text-center">
                  <Building2 className="w-9 h-9 text-slate-700" />
                  <p className="text-sm text-slate-400">Empresa não encontrada</p>
                  <p className="text-xs text-slate-600">Tente pela aba CNPJ ou importe uma NF-e</p>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setTab('cnpj')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Buscar por CNPJ
                    </button>
                    <button type="button" onClick={() => setTab('nfe')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Importar NF-e
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Tab: CNPJ ──────────────────────────────────────────────── */}
        {tab === 'cnpj' && (
          <motion.div
            key="cnpj"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-3"
          >
            <p className="text-xs text-slate-500">
              Digite o CNPJ para consultar os dados completos da empresa na Receita Federal.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  value={cnpjInput}
                  onChange={e => handleCNPJInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), runCNPJSearch())}
                  disabled={disabled || cnpjLoading}
                  placeholder="00.000.000/0001-00"
                  className="pl-10 bg-slate-800/80 border-slate-600 text-white h-11 text-sm bp-focus-input font-mono tracking-wider"
                  maxLength={18}
                />
              </div>
              <Button
                type="button"
                onClick={runCNPJSearch}
                disabled={disabled || cnpjLoading || cleanCNPJ(cnpjInput).length !== 14}
                className="h-11 px-4 text-white flex-shrink-0 hover:opacity-90"
                style={{ backgroundColor: 'var(--bp-primary)' }}
              >
                {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {cnpjError && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {cnpjError}
              </div>
            )}

            <AnimatePresence>
              {cnpjResult && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-green-400 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Empresa encontrada
                  </p>
                  <CompanyCard company={cnpjResult} onSelect={handleSelect} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Tab: NF-e XML ──────────────────────────────────────────── */}
        {tab === 'nfe' && (
          <motion.div
            key="nfe"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-3"
          >
            <p className="text-xs text-slate-500">
              Importe o XML de uma NF-e para preencher os dados automaticamente.
              O arquivo fica somente no seu dispositivo — nada é enviado ao servidor.
            </p>

            {!nfeData ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Selecionar arquivo NF-e XML"
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-[color-mix(in_srgb,var(--bp-primary)_50%,transparent)] transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
              >
                {nfeParsing ? (
                  <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                ) : (
                  <FileUp className="w-8 h-8 text-slate-600" />
                )}
                <div className="text-center">
                  <p className="text-sm text-slate-400 font-medium">
                    {nfeParsing ? 'Lendo arquivo…' : 'Clique para selecionar o XML'}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Aceita arquivos .xml de NF-e</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xml,application/xml,text/xml"
                  className="hidden"
                  onChange={handleNFeFile}
                  disabled={disabled || nfeParsing}
                />
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dados extraídos da NF-e</p>
                  <button
                    type="button"
                    onClick={() => { setNfeData(null); setNfeError(''); }}
                    className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Outro arquivo
                  </button>
                </div>

                {nfeData.dest && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider bp-text-primary mb-1.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Contratante / Destinatário
                    </p>
                    <CompanyCard
                      company={nfeData.dest}
                      onSelect={handleSelect}
                      sourceBadge={{ label: 'DEST', style: { background: 'rgba(6,182,212,0.1)', color: '#67e8f9', borderColor: 'rgba(6,182,212,0.3)' } }}
                    />
                  </div>
                )}
                {nfeData.emit && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1">
                      <User className="w-3 h-3" /> Emitente
                    </p>
                    <CompanyCard
                      company={nfeData.emit}
                      onSelect={handleSelect}
                      sourceBadge={{ label: 'EMIT', style: { background: 'rgba(245,158,11,0.1)', color: '#fcd34d', borderColor: 'rgba(245,158,11,0.3)' } }}
                    />
                  </div>
                )}
                <p className="text-[10px] text-slate-600">
                  Dados extraídos localmente — confirme com a Receita Federal via aba CNPJ para dados completos.
                </p>
              </motion.div>
            )}

            {nfeError && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {nfeError}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
