import { AlertTriangle, ChevronRight } from 'lucide-react';

const fmtDay = (iso) => String(iso || '').slice(5, 10).split('-').reverse().join('/');

/**
 * Alerta enxuto no topo do Início apenas quando há dias passados recentes sem horas lançadas.
 * Evita duplicar resumo financeiro/metas que já aparecem no bloco Financeiro.
 */
export default function HomeMonthSummary({ missing = [], onOpenEvent }) {
  if (!missing || missing.length === 0) return null;

  return (
    <section className="mb-4 space-y-2" aria-label="Pendências de horas">
      {missing.slice(0, 2).map(({ event, dias }) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onOpenEvent?.(event)}
          className="w-full flex items-center gap-3 rounded-xl border border-[#ffd400]/40 bg-[#ffd400]/10 hover:bg-[#ffd400]/15 transition-colors px-4 py-3 text-left min-h-[48px]"
        >
          <AlertTriangle className="w-5 h-5 text-[#ffd400] shrink-0" />
          <span className="flex-1 min-w-0 text-sm text-[#ffd400]">
            <span className="font-semibold">Horas não lançadas</span>
            {' — '}
            <span className="truncate">{event.title || 'Evento'}</span>
            {' ('}
            {dias.map(fmtDay).join(', ')}
            {')'}
          </span>
          <ChevronRight className="w-4 h-4 text-[#ffd400] shrink-0" />
        </button>
      ))}
    </section>
  );
}
