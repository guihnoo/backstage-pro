import { useMemo } from 'react';
import { useAuth } from '@/lib/authContext';
import { isNfPendingEvent } from '@/lib/eventFinance';
import { MEI_LIMIT } from '@/lib/useBackstageData';
import { eventFunctionId, categoryLabel } from '@/lib/roleRates';
function Panel({
  title,
  children,
  ...props
}) {
  return <section className="panel" {...props}><h2>{title}</h2>{children}</section>;
}
function Empty({
  children
}) {
  return <p className="empty">{children}</p>;
}
export default function FinanceLegacyPanels({
  activeTab,
  dashboard,
  currentDate,
  money,
  events,
  fiscalExtra,
  analiseExtra,
  slot,
  openDetail,
  isVisible
}) {
  const {
    profile
  } = useAuth();
  const {
    billedRows
  } = dashboard;
  const monthPending = billedRows.filter(r => !r.paid).reduce((s, r) => s + Math.round(r.amount * 100), 0) / 100;
  const byFunction = useMemo(() => {
    const grouped = new Map();
    for (const row of billedRows) {
      const id = eventFunctionId(row.event, profile) || 'sem';
      const item = grouped.get(id) || {
        id,
        label: categoryLabel(id) || 'Sem função',
        value: 0,
        count: 0
      };
      item.value += row.amount;
      item.count += 1;
      grouped.set(id, item);
    }
    return [...grouped.values()].sort((a, b) => b.value - a.value);
  }, [billedRows, profile]);

  // Usa as mesmas datas e valores finais do recebido mensal.
  const annualTotal = useMemo(() => dashboard.rows.filter(row => row.paid && row.amountSource !== 'calculated' && row.receivedDate?.startsWith(String(currentDate.getFullYear()))).reduce((sum, row) => sum + Math.round(row.receivedAmount * 100), 0) / 100, [dashboard.rows, currentDate]);
  const meiPct = Math.min(100, Math.round(annualTotal / MEI_LIMIT * 100));
  const nfPendentes = events.filter(isNfPendingEvent).length;
  const funcMax = Math.max(1, ...byFunction.map(i => i.value));
  // Anel do MEI (lote 3): enche até a % do limite anual.
  const R = 52, C = 2 * Math.PI * R;
  const meiCor = meiPct >= 90 ? '#ff2e88' : '#ffd400';
  return <>
      {activeTab === 'fiscal' && <div className="space-y-4">
        <section className="fm-fiscal" data-testid="fiscal-mei">
          <div className="fm-ring" aria-hidden="true">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r={R} fill="none" stroke="#262626" strokeWidth="12" />
              <circle cx="60" cy="60" r={R} fill="none" stroke={meiCor} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={isVisible ? C * (1 - meiPct / 100) : C} transform="rotate(-90 60 60)" className="fm-ring-fill" />
            </svg>
            <span style={{ color: meiCor }}>{isVisible ? meiPct + '%' : '•••'}</span>
          </div>
          <div className="min-w-0">
            <p className="fm-tag text-[#a8a8a8]">MEI · Recebido no ano</p>
            <p className="fm-mid">{money(annualTotal)}</p>
            {isVisible ? <p className="text-xs text-[#ccc] mt-1">de R$ 81.000 · {annualTotal < MEI_LIMIT ? 'dentro do limite anual.' : 'atenção: limite anual atingido.'}</p> : <Empty>Valores e indicador fiscal ocultos.</Empty>}
          </div>
        </section>
        <div className="fm-kpis two">
          <div className="fm-kpi"><span className="fm-tag fm-kpi-head">DAS MEI</span><span className="fm-mid">Dia 20</span><span className="fm-note">Guia mensal PGMEI</span></div>
          <div className={'fm-kpi' + (nfPendentes ? ' pink' : '')}><span className="fm-tag fm-kpi-head">Notas fiscais</span><span className="fm-mid">{nfPendentes}</span><span className="fm-note">{nfPendentes === 1 ? 'show feito sem nota' : 'shows feitos sem nota'}</span></div>
        </div>
        {slot(fiscalExtra)}
      </div>}

      {activeTab === 'analise' && <div className="space-y-4">
        <div className="fm-kpis two">
          <div className="fm-kpi"><span className="fm-tag fm-kpi-head">Encerrados no mês</span><span className="fm-mid" style={{ color: '#ffd400' }}>{billedRows.length}</span><span className="fm-note">trabalhos que terminaram</span></div>
          <button type="button" className="fm-kpi pink" onClick={event => openDetail('pending', event)} aria-label="Ver detalhes: Realizados do mês ainda não pagos"><span className="fm-tag fm-kpi-head">Feitos e não pagos</span><span className="fm-mid">{money(monthPending)}</span><span className="fm-note">ver composição ↗</span></button>
        </div>
        {byFunction.length > 1 && <Panel title="Por função" data-testid="por-funcao">
          <div className="space-y-3">{byFunction.map(item => <div key={item.id}>
            <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-bold">{item.label} <span className="font-tag text-[10px] text-[#aaa]">{item.count}×</span></span><span className="font-tag text-xs text-[#ffd400]">{money(item.value)}</span></div>
            <div className="mt-1.5 h-2 rounded-full bg-[#262626] overflow-hidden"><div className="h-full rounded-full bg-[#ffd400] fm-grow-x" style={{ width: (isVisible ? Math.max(4, item.value / funcMax * 100) : 0) + '%' }} /></div>
          </div>)}</div>
          <p className="mt-3 text-[11px] text-[#aaa]">Eventos encerrados no mês, pelo valor de cada trabalho.</p>
        </Panel>}
        <p className="text-[11px] leading-relaxed text-[#8a8a8a] px-1">Faturamento conta pelo fim do trabalho; recebido, pela data do pagamento. Despesas não registradas não entram no saldo.</p>
        {slot(analiseExtra)}
      </div>}
</>;
}
