import { hardNavigate } from '@/lib/hardNavigate';
import { ChevronRight } from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { Skeleton } from '@/components/ui/skeleton';

// Visual "All Access": quanto sobrou no bolso no mês + recebido / a receber / despesas.
function Tile({ label, value, color = '#ffffff', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-[#161616] px-2.5 py-2 text-left min-w-0 active:scale-95 transition-transform"
    >
      <p className="font-tag text-[10px] font-bold tracking-[0.08em] text-[#a8a8a8]">{label}</p>
      <p className="font-poster text-[19px] leading-tight truncate" style={{ color }}>{value}</p>
    </button>
  );
}

export default function PipelineFinanceiro({ stats, despesasMes = 0, isLoading, primaryHex = '#ffd400', accentHex = '#ff2e88' }) {
  const { formatCurrency } = useFinancialVisibility();
  const pago = stats?.faturamento_pago ?? 0;
  const aReceber = stats?.a_receber ?? 0;
  const total = pago + aReceber;
  const sobrou = pago - despesasMes;
  const percentualPago = total > 0 ? (pago / total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="mb-4 space-y-2">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      <button
        type="button"
        onClick={() => hardNavigate('/reports')}
        className="w-full text-left rounded-2xl px-4 py-3.5 active:scale-[0.99] transition-transform"
        style={{ background: primaryHex, color: '#0a0a0a' }}
      >
        <div className="flex items-center justify-between">
          <p className="font-tag text-[11px] font-bold tracking-[0.12em]">SOBROU NO BOLSO · MÊS</p>
          <span className="flex items-center text-xs font-extrabold">Dinheiro<ChevronRight className="w-4 h-4" /></span>
        </div>
        <p className="font-poster text-[44px] leading-none mt-1 truncate">{formatCurrency(sobrou)}</p>
        <p className="text-[13px] font-bold mt-1">recebido menos suas despesas</p>
        {total > 0 && (
          <div className="mt-2.5">
            <div className="h-2.5 rounded-full bg-[#0a0a0a]/20 overflow-hidden">
              <div className="h-full rounded-full bg-[#0a0a0a]" style={{ width: `${percentualPago}%` }} />
            </div>
            <p className="font-tag text-[10px] font-bold mt-1">{percentualPago.toFixed(0)}% DO MÊS JÁ CAIU NA CONTA</p>
          </div>
        )}
      </button>
      <div className="grid grid-cols-3 gap-2">
        <Tile label="RECEBIDO" value={formatCurrency(pago)} onClick={() => hardNavigate('/reports')} />
        <Tile label="A RECEBER" value={formatCurrency(aReceber)} color={accentHex} onClick={() => hardNavigate('/reports?aba=receber')} />
        <Tile label="DESPESAS" value={formatCurrency(despesasMes)} onClick={() => hardNavigate('/expenses')} />
      </div>
    </div>
  );
}
