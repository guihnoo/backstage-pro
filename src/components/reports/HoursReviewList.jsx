import { useMemo, useState } from 'react';
import { ClipboardCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { findHoursIssues } from '@/lib/hoursReview';
import { formatDisplayDate } from '@/components/utils/dateUtils';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { getClientDisplayName } from '@/lib/eventDisplay';

const PAGE = 20;

/**
 * Lote 4 — lista de eventos antigos com possível erro de horas/cachê.
 * Só mostra; nada é corrigido sozinho. Eventos pagos aparecem só para conferência.
 */
export default function HoursReviewList({ events = [], dailyWork = [], clients = [], onOpenEvent }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const [shown, setShown] = useState(PAGE);
  const issues = useMemo(() => findHoursIssues(events, dailyWork), [events, dailyWork]);
  const clientName = (id) => getClientDisplayName(clients.find((c) => c.id === id));
  const money = (v) => (isVisible ? formatCurrency(v) : '••••');

  return (
    <div className="rounded-2xl bg-[#161616] border border-[#222222] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8]">CONFERIR HORAS</div>
          <h3 className="font-poster text-[22px] leading-none text-white mt-1 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#ffd400]" />
            SHOWS PARA REVISAR
          </h3>
          <p className="text-xs text-[#a8a8a8] mt-1.5">
            Shows que já terminaram com possível erro de horas ou cachê. Nada é corrigido sozinho:
            abra o evento e decida.
          </p>
        </div>
        <span className="font-poster text-[22px] leading-none text-[#ffd400] flex-shrink-0">
          {issues.length}
        </span>
      </div>

      {issues.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-emerald-400 py-4">
          <CheckCircle2 className="w-4 h-4" /> Nenhum possível erro encontrado.
        </p>
      ) : (
        <ul className="divide-y divide-[#2a2a2a]">
          {issues.slice(0, shown).map((issue, idx) => (
            <li key={`${issue.eventId}-${issue.date}-${issue.tipo}-${idx}`} className="py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {issue.event.title || 'Evento'}
                  <span className="text-[#888888]"> · {formatDisplayDate(issue.date)}</span>
                </p>
                {issue.event.client_id && (
                  <p className="text-[11px] text-[#888888] truncate">{clientName(issue.event.client_id)}</p>
                )}
                <p className="text-xs text-[#ffd400] mt-0.5">{issue.titulo}</p>
                <p className="text-[11px] text-[#a8a8a8]">
                  Gravado {money(issue.valorGravado)} · pela regra atual {money(issue.valorRegraAtual)}
                  {issue.pago && <span className="ml-2 text-[#888888]">(já pago — só conferência)</span>}
                </p>
              </div>
              {onOpenEvent && (
                <button
                  type="button"
                  onClick={() => onOpenEvent(issue.event)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs text-[#ffd400] hover:text-[#ffd400]"
                >
                  Abrir <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {issues.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE)}
          className="w-full text-xs text-[#a8a8a8] hover:text-white py-2 border border-[#2a2a2a] rounded-lg"
        >
          Mostrar mais ({issues.length - shown})
        </button>
      )}
    </div>
  );
}
