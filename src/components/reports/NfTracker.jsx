import { useMemo, useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { getEventCacheAmount } from '@/lib/eventFinance';
import EventHeading from '@/components/events/EventHeading';

function StatCard({ icon: Icon, label, value, sub, iconClass }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black text-white truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function EventRow({ event, client, onOpen }) {
  const { isVisible, formatCurrency } = useFinancialVisibility();
  const amount = Number(event.paid_amount) || getEventCacheAmount(event);
  const dateLabel = event.start_date
    ? format(parseISO(event.start_date), "d MMM yyyy", { locale: ptBR })
    : '—';
  // Suporta campo legado (nf_number) e novo (nfe_numero + nfe_arquivo_url do S140)
  const nfeNumero = event.nfe_numero || event.nf_number || null;
  const hasNf = Boolean(nfeNumero) || Boolean(event.nfe_arquivo_url);
  const nfeOk = event.nfe_analise?.cliente_reconhecido && event.nfe_analise?.valor_confere;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-800/50 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasNf ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      <div className="flex-1 min-w-0">
        <EventHeading event={event} client={client} size="sm" />
        <p className="text-[11px] text-slate-500 truncate mt-0.5">{dateLabel}</p>
      </div>
      <div className="text-right flex-shrink-0 mr-1">
        {hasNf ? (
          <div className="flex items-center justify-end gap-1">
            {nfeOk && (
              <Sparkles className="w-3 h-3 text-emerald-400" title="Verificada pela IA" />
            )}
            <p className="text-[11px] font-mono text-emerald-400">
              {nfeNumero ? `NF ${nfeNumero}` : 'Arquivo anexado'}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-amber-400 font-medium">Pendente</p>
        )}
        <p className="text-[11px] text-slate-500">{isVisible ? formatCurrency(amount) : '•••'}</p>
      </div>
      <button
        type="button"
        onClick={() => onOpen(event)}
        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800/60 transition-colors flex-shrink-0 bp-hover-primary"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function NfTracker({ events = [], clients = [], onOpenEvent }) {
  const { isVisible, formatCurrency } = useFinancialVisibility();
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllIssued, setShowAllIssued] = useState(false);

  const clientById = useMemo(() => {
    const map = {};
    clients.forEach(c => { map[c.id] = c; });
    return map;
  }, [clients]);

  const { pending, issued } = useMemo(() => {
    const hasNfFor = (e) => Boolean(e.nf_number) || Boolean(e.nfe_numero) || Boolean(e.nfe_arquivo_url);
    const relevant = events.filter(e =>
      e.status !== 'cancelled' &&
      (Number(e.paid_amount) > 0 || getEventCacheAmount(e) > 0)
    );
    const p = relevant
      .filter(e => !hasNfFor(e))
      .sort((a, b) => (b.start_date || '') > (a.start_date || '') ? 1 : -1);
    const i = relevant
      .filter(e => hasNfFor(e))
      .sort((a, b) => {
        const da = b.nf_issued_at || b.start_date || '';
        const db = a.nf_issued_at || a.start_date || '';
        return da > db ? 1 : -1;
      });
    return { pending: p, issued: i };
  }, [events]);

  const pendingValue = useMemo(
    () => pending.reduce((s, e) => s + (Number(e.paid_amount) || getEventCacheAmount(e)), 0),
    [pending]
  );

  const LIMIT = 5;
  const visiblePending = showAllPending ? pending : pending.slice(0, LIMIT);
  const visibleIssued = showAllIssued ? issued : issued.slice(0, LIMIT);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={FileText}
          label="Emitidas"
          value={issued.length}
          iconClass="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          icon={AlertCircle}
          label="Pendentes"
          value={pending.length}
          iconClass="bg-amber-500/10 text-amber-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Valor pendente"
          value={isVisible ? formatCurrency(pendingValue) : '•••••'}
          sub={`${pending.length} show${pending.length !== 1 ? 's' : ''}`}
          iconClass="bg-slate-700/50 text-slate-400"
        />
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="bg-slate-900/40 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Sem Nota Fiscal ({pending.length})
            </h3>
          </div>
          <div>
            {visiblePending.map(ev => (
              <EventRow
                key={ev.id}
                event={ev}
                client={clientById[ev.client_id]}
                onOpen={onOpenEvent}
              />
            ))}
          </div>
          {pending.length > LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllPending(v => !v)}
              className="mt-2 text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {showAllPending
                ? <><ChevronUp className="w-3 h-3" />Mostrar menos</>
                : <><ChevronDown className="w-3 h-3" />Ver mais {pending.length - LIMIT} eventos</>
              }
            </button>
          )}
        </div>
      )}

      {/* Issued */}
      {issued.length > 0 && (
        <div className="bg-slate-900/40 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Nota Fiscal Emitida ({issued.length})
            </h3>
          </div>
          <div>
            {visibleIssued.map(ev => (
              <EventRow
                key={ev.id}
                event={ev}
                client={clientById[ev.client_id]}
                onOpen={onOpenEvent}
              />
            ))}
          </div>
          {issued.length > LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllIssued(v => !v)}
              className="mt-2 text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {showAllIssued
                ? <><ChevronUp className="w-3 h-3" />Mostrar menos</>
                : <><ChevronDown className="w-3 h-3" />Ver mais {issued.length - LIMIT} eventos</>
              }
            </button>
          )}
        </div>
      )}

      {pending.length === 0 && issued.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum evento com valor registrado</p>
          <p className="text-sm mt-1">Adicione shows com cache para rastrear as notas fiscais</p>
        </div>
      )}
    </div>
  );
}
