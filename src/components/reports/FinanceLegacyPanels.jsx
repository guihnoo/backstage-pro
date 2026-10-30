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
function Metric({
  label,
  value,
  money,
  onClick
}) {
  return <button className="card" onClick={onClick}><span>{label}</span><strong className="amount">{money(value)}</strong><small>Ver composição ↗</small></button>;
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
  return <>      {activeTab === 'fiscal' && <div className="space-y-4">
        <Panel title="MEI · Recebido no ano">
          <div className="font-poster text-4xl">{money(annualTotal)}</div>
          {isVisible ? <><div className="my-3 h-2.5 overflow-hidden rounded-full bg-[#2a2a2a]"><div style={{
              width: meiPct + '%'
            }} className="h-full bg-[#ffd400]" /></div><p className="text-xs text-[#ccc]">{meiPct}% do limite anual do MEI (R$ 81.000) · {annualTotal < MEI_LIMIT ? 'você está seguro dentro do limite anual.' : 'atenção: limite anual atingido.'}</p></> : <Empty>Valores e indicador fiscal ocultos.</Empty>}
        </Panel>
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel title="DAS MEI"><div className="font-poster text-2xl">Vence dia 20</div><p className="mt-1 text-xs text-[#ffd400]">Guia mensal PGMEI</p></Panel>
          <Panel title="Notas fiscais"><div className="font-poster text-2xl">{events.filter(isNfPendingEvent).length} pendentes</div><p className="mt-1 text-xs text-[#aaa]">Shows feitos sem nota</p></Panel>
        </div>
        {slot(fiscalExtra)}
      </div>}

      {activeTab === 'analise' && <div className="space-y-4">
        <Panel title="Trabalhos encerrados no mês"><div className="font-poster text-4xl text-[#ffd400]">{billedRows.length}</div><p className="mt-2 text-xs text-[#aaa]">Faturamento pelo encerramento; eventos futuros ficam na previsão.</p></Panel>
        <Metric label="Realizados do mês ainda não pagos" value={monthPending} money={money} pink onClick={event => openDetail('pending', event)} />
        {byFunction.length > 1 && <Panel title="Por função" data-testid="por-funcao">
          <div className="space-y-3">{byFunction.map(item => <div key={item.id} className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-bold">{item.label} <span className="font-tag text-[10px] text-[#aaa]">{item.count}×</span></span><span className="font-tag text-xs text-[#ffd400]">{money(item.value)}</span></div>)}</div>
          <p className="mt-3 text-[11px] text-[#aaa]">Eventos encerrados no mês, pelo valor de cada trabalho.</p>
        </Panel>}
        <Panel title="O que cada número representa"><p className="text-xs leading-relaxed text-[#bbb]">Faturamento e recebimentos têm datas de referência diferentes. Comparar suas somas não mede a taxa de pagamento dos mesmos eventos. Despesas não registradas também não entram no saldo apresentado.</p></Panel>
        {slot(analiseExtra)}
      </div>}
</>;
}
