import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Building2, MapPin, CheckCircle2, Loader2, X, Database, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompanies } from '@/lib/useCompanies';
import { searchCompanies, fetchByCNPJ, formatCNPJ, looksLikeCNPJ, cleanCNPJ } from '@/lib/cnpjSearch';

/**
 * Campo de busca inteligente de empresas.
 *
 * Busca primeiro no banco compartilhado do Backstage Pro,
 * depois na API externa (open.cnpja.com / BrasilAPI).
 *
 * onSelect(company) → objeto normalizado para preencher o ClientForm
 */
export default function CompanySearchInput({ onSelect, disabled }) {
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [searchedExternal, setSearchedExternal] = useState(false);

  const { searchLocal } = useCompanies();
  const abortRef  = useRef(null);
  const wrapRef   = useRef(null);
  const debounceRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const runSearch = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }

    // Cancela busca anterior
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setSearchedExternal(false);

    try {
      // 1) Banco local (Backstage Pro — compartilhado)
      const local = await searchLocal(q);

      // 2) API externa em paralelo
      let external = [];
      try {
        external = await searchCompanies(q, abortRef.current.signal);
        setSearchedExternal(true);
      } catch { /* API externa opcional */ }

      // Mescla: locais primeiro, depois externos não duplicados
      const localCNPJs = new Set(local.map(c => c.cnpj).filter(Boolean));
      const merged = [
        ...local.map(c => ({ ...c, _origin: 'local' })),
        ...external
          .filter(c => !c.cnpj || !localCNPJs.has(c.cnpj))
          .map(c => ({ ...c, _origin: 'api' })),
      ];

      setResults(merged);
      setOpen(merged.length > 0);
    } finally {
      setLoading(false);
    }
  }, [searchLocal]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedName('');

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 400);
  };

  const handleSelect = async (company) => {
    setOpen(false);
    setQuery('');

    // Se é resultado parcial da API (sem endereço completo), busca detalhes
    let full = company;
    if (company._origin === 'api' && company._partial && company.cnpj) {
      setLoading(true);
      try {
        const detail = await fetchByCNPJ(company.cnpj);
        if (detail) full = { ...detail, _origin: 'api' };
      } catch { /* usa o parcial */ }
      setLoading(false);
    }

    const displayName = full.trading_name || full.name;
    setSelectedName(displayName);
    onSelect(full);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedName('');
    setResults([]);
    setOpen(false);
    onSelect(null);
  };

  const isCNPJQuery = looksLikeCNPJ(query);

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Label */}
      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
        Buscar empresa
      </p>

      {/* Campo */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin pointer-events-none" />
        )}
        {selectedName && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-slate-300" />
          </button>
        )}
        <Input
          value={selectedName || query}
          onChange={selectedName ? undefined : handleChange}
          onFocus={() => results.length > 0 && !selectedName && setOpen(true)}
          disabled={disabled}
          readOnly={!!selectedName}
          placeholder={isCNPJQuery ? 'Digite o CNPJ completo (14 dígitos)' : 'Nome da empresa, CNPJ ou cidade…'}
          className={`pl-10 pr-9 bg-slate-800/80 border-slate-600 text-white h-11 text-sm transition-colors
            ${selectedName ? 'border-cyan-500/60 bg-cyan-950/30 cursor-default' : 'focus:border-cyan-500'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      {/* Empresa selecionada */}
      <AnimatePresence>
        {selectedName && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-cyan-300"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>Dados preenchidos automaticamente — ajuste se necessário</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown de resultados */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden max-h-[340px] overflow-y-auto"
          >
            {/* Grupos: local vs externo */}
            {renderGroup(results.filter(r => r._origin === 'local'), 'No Backstage Pro', <Database className="w-3 h-3" />, 'text-cyan-400', handleSelect)}
            {renderGroup(results.filter(r => r._origin === 'api'), 'Receita Federal / Internet', <Globe className="w-3 h-3" />, 'text-green-400', handleSelect)}

            {searchedExternal && results.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">
                Nenhuma empresa encontrada. Preencha os campos manualmente abaixo.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderGroup(items, label, icon, iconClass, onSelect) {
  if (!items.length) return null;
  return (
    <div>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider ${iconClass} bg-slate-800/60 border-b border-slate-700/50`}>
        <span className={iconClass}>{icon}</span>
        {label}
      </div>
      {items.map((company, i) => (
        <CompanyResultRow key={company.cnpj || company.id || i} company={company} onSelect={onSelect} />
      ))}
    </div>
  );
}

function CompanyResultRow({ company, onSelect }) {
  const displayName = company.trading_name || company.name || '';
  const razao = company.trading_name && company.name !== company.trading_name ? company.name : '';
  const location = [company.city, company.state].filter(Boolean).join(' / ');
  const cnpj = company.cnpj ? formatCNPJ(company.cnpj) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(company)}
      className="w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-slate-800/80 transition-colors border-b border-slate-800/50 last:border-0"
    >
      {/* Ícone */}
      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Building2 className="w-4 h-4 text-slate-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate leading-tight">{displayName}</p>
        {razao && (
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{razao}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {location && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {location}
            </span>
          )}
          {cnpj && (
            <span className="text-[11px] text-slate-500 font-mono">{cnpj}</span>
          )}
          {company.verified && (
            <Badge className="text-[9px] py-0 px-1.5 h-4 bg-green-500/20 text-green-300 border-green-500/30">
              verificado
            </Badge>
          )}
          {company.status && company.status.toLowerCase() !== 'ativa' && (
            <Badge className="text-[9px] py-0 px-1.5 h-4 bg-red-500/20 text-red-300 border-red-500/30">
              {company.status}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
