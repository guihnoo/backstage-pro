import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

const fmtDay = (iso) => String(iso || '').slice(5, 10).split('-').reverse().join('/');

/**
 * Topo do Início: o mês numa linha + lembrete de dias recentes sem horas lançadas.
 * Sem animação (abre rápido no celular).
 */
export default function HomeMonthSummary({ summary, missing = [], onOpenEvent, primaryHex }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  if (!summary) return null;
  const money = (v) => (isVisible ? formatCurrency(v) : '••••');

  let metaText = null;
  if (summary.meta?.atingida) metaText = 'meta do mês atingida';
  else if (summary.meta) {
    const partes = [];
    if (summary.meta.faltaReceita) partes.push(isVisible ? money(summary.meta.faltaReceita) : '••••');
    if (summary.meta.faltaDiarias) partes.push(`${summary.meta.faltaDiarias} ${summary.meta.faltaDiarias === 1 ? 'diária' : 'diárias'}`);
    if (partes.length) metaText = `faltam ${partes.join(' ou ')} para a meta`;
  }

  return (
    <section className="mb-4 space-y-2" aria-label="Resumo do mês">
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          <span className="font-bold text-white">{summary.mes}:</span>{' '}
          {summary.eventos} {summary.eventos === 1 ? 'evento' : 'eventos'}
          {' · '}
          <span className="font-semibold text-emerald-400 font-mono">{money(summary.recebido)}</span> recebidos
          {' · '}
          <span className="font-semibold font-mono" style={{ color: primaryHex }}>{money(summary.aReceber)}</span> a receber
          {metaText && (
            <>
              {' · '}
              <span className={summary.meta?.atingida ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>{metaText}</span>
            </>
          )}
        </p>
      </div>

      {missing.slice(0, 2).map(({ event, dias }) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onOpenEvent?.(event)}
          className="w-full flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left min-h-[48px]"
        >
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="flex-1 min-w-0 text-sm text-amber-100">
            <span className="font-semibold">Horas não lançadas</span>
            {' — '}
            <span className="truncate">{event.title || 'Evento'}</span>
            {' ('}
            {dias.map(fmtDay).join(', ')}
            {')'}
          </span>
          <ChevronRight className="w-4 h-4 text-amber-300 shrink-0" />
        </button>
      ))}
    </section>
  );
}
