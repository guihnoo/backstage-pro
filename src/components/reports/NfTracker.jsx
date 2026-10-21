import { useMemo, useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { getEventCacheAmount, hasNfFor, isNfPendingEvent } from '@/lib/eventFinance';
import EventHeading from '@/components/events/EventHeading';

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
    <div className="flex items-center gap-3 py-2.5 border-b border-[#2a2a2a] last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasNf ? 'bg-emerald-400' : 'bg-[#ffd400]'}`} />
      <div className="flex-1 min-w-0">
        <EventHeading event={event} client={client} size="sm" />
        <p className="text-[11px] text-[#888888] truncate mt-0.5">{dateLabel}</p>
      </div>
      <div className="text-right flex-shrink-0 mr-1">
        {hasNf ? (
          <div className="flex items-center justify-end gap-1">
            {nfeOk && (
              <Sparkles className="w-3 h-3 text-emerald-400" title="Verificada pela IA" />
            )}
            <p className="text-[11px] font-tag text-emerald-400">
              {nfeNumero ? `NF ${nfeNumero}` : 'Arquivo anexado'}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-[#ffd400] font-medium">Pendente</p>
        )}
        <p className="text-[11px] text-[#888888]">{isVisible ? formatCurrency(amount) : '•••'}</p>
      </div>
      <button
        type="button"
        onClick={() => onOpen(event)}
        className="p-1.5 rounded-lg text-[#888888] hover:bg-[#1f1f1f] transition-colors flex-shrink-0 bp-hover-primary"
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
    const relevant = events.filter(e =>
      e.status !== 'cancelled' &&
      (Number(e.paid_amount) > 0 || getEventCacheAmount(e) > 0)
    );
    const p = relevant
      .filter(isNfPendingEvent)
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
    <div className="space-y-2.5">
      {/* Pending */}
      {pending.length > 0 && (
        <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4" style={{ borderLeft: '4px solid #ffd400' }}>
          <div className="flex items-end justify-between gap-2 mb-2">
            <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8]">SEM NOTA FISCAL · {pending.length}</div>
            <div className="font-poster text-[20px] leading-none text-[#ffd400]">
              {isVisible ? formatCurrency(pendingValue) : '•••••'}
            </div>
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
              className="mt-2 text-xs text-[#a8a8a8] hover:text-white flex items-center gap-1 transition-colors"
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
        <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4">
          <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] mb-2">NOTA FISCAL EMITIDA · {issued.length}</div>
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
              className="mt-2 text-xs text-[#a8a8a8] hover:text-white flex items-center gap-1 transition-colors"
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
        <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4 text-center">
          <FileText className="w-6 h-6 mx-auto mb-1.5 text-[#555555]" />
          <p className="text-sm font-bold text-white">Nenhuma nota para acompanhar ainda</p>
          <p className="text-xs text-[#888888] mt-0.5">Shows com cachê aparecem aqui depois que acontecem.</p>
        </div>
      )}
    </div>
  );
}
