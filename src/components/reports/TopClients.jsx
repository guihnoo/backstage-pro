import { useMemo } from 'react';
import { Users, TrendingUp, ExternalLink } from 'lucide-react';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { getEventStatus } from '@/components/utils/dateUtils';
import { hardNavigate } from '@/lib/hardNavigate';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const SCORE_CONFIG = {
  Excelente: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  Bom:       { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  Regular:   { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  Atenção:   { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
};

function paymentScore(events) {
  const completed = events.filter(e => getEventStatus(e) === 'completed');
  if (!completed.length) return null;
  const paid = completed.filter(e => e.payment_status === 'paid').length;
  const pct = Math.round((paid / completed.length) * 100);
  const label = pct >= 90 ? 'Excelente' : pct >= 70 ? 'Bom' : pct >= 40 ? 'Regular' : 'Atenção';
  return { pct, label };
}

export default function TopClients({ events = [], clients = [] }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { primaryHex, accentHex } = useCategoryTheme();

  const ranked = useMemo(() => {
    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c; });

    const byClient = {};
    events.forEach(ev => {
      if (!ev.client_id) return;
      const st = getEventStatus(ev);
      if (st === 'cancelled') return;
      if (!byClient[ev.client_id]) byClient[ev.client_id] = [];
      byClient[ev.client_id].push(ev);
    });

    return Object.entries(byClient)
      .map(([clientId, evs]) => {
        const client = clientMap[clientId];
        const paidEvs = evs.filter(e => e.payment_status === 'paid');
        const revenue = paidEvs.reduce((s, e) => s + (getEventCacheAmount(e) || 0), 0);
        const totalRevenue = evs.reduce((s, e) => s + (getEventCacheAmount(e) || 0), 0);
        const lastShow = evs
          .map(e => e.start_date || '')
          .filter(Boolean)
          .sort()
          .at(-1);
        const score = paymentScore(evs);
        return {
          clientId,
          name: client?.name || 'Cliente desconhecido',
          revenue,
          totalRevenue,
          showCount: evs.length,
          lastShow,
          score,
          avgTicket: evs.length > 0 ? totalRevenue / evs.length : 0,
        };
      })
      .filter(r => r.totalRevenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [events, clients]);

  if (!ranked.length) return null;

  const maxRevenue = ranked[0]?.revenue || 1;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="p-1.5 rounded-lg border"
          style={{ backgroundColor: `${primaryHex}1a`, borderColor: `${primaryHex}33` }}
        >
          <Users className="w-4 h-4" style={{ color: primaryHex }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Top Clientes</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">por receita recebida</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
          <TrendingUp className="w-3 h-3" />
          {ranked.length} clientes
        </div>
      </div>

      {/* Lista */}
      <ul className="space-y-3">
        {ranked.map((item, idx) => {
          const barWidth = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
          const scoreConf = item.score ? SCORE_CONFIG[item.score.label] : null;

          return (
            <li key={item.clientId}>
              <button
                type="button"
                onClick={() => hardNavigate(`/client-detail?id=${item.clientId}`)}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  {/* Posição */}
                  <span className={`text-xs font-bold tabular-nums w-5 shrink-0 ${
                    idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Nome */}
                  <span className="text-sm font-medium text-white truncate flex-1 group-hover:[color:var(--bp-primary)] transition-colors">
                    {item.name}
                  </span>

                  {/* Score */}
                  {scoreConf && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${scoreConf.bg} ${scoreConf.color}`}>
                      {item.score.label}
                    </span>
                  )}

                  {/* Link */}
                  <ExternalLink className="w-3 h-3 text-slate-600 group-hover:[color:var(--bp-primary)] shrink-0 transition-colors" />
                </div>

                {/* Barra proporcional */}
                <div className="flex items-center gap-2 pl-7">
                  <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        background: idx === 0
                          ? `linear-gradient(90deg, ${accentHex}, ${primaryHex})`
                          : 'linear-gradient(90deg, #475569, #334155)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white shrink-0 tabular-nums">
                    {isVisible ? formatCurrency(item.revenue) : '••••'}
                  </span>
                </div>

                {/* Meta linha */}
                <div className="flex items-center gap-3 pl-7 mt-0.5">
                  <span className="text-[10px] text-slate-500">
                    {item.showCount} show{item.showCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">
                    ticket médio {isVisible ? formatCurrency(item.avgTicket) : '••••'}
                  </span>
                  {item.lastShow && (
                    <>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-500">
                        último: {new Date(item.lastShow + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                      </span>
                    </>
                  )}
                  {item.score && (
                    <span className="text-[10px] text-slate-600 ml-auto">
                      {item.score.pct}% pago
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Legenda */}
      <p className="text-[10px] text-slate-600 border-t border-slate-700/40 pt-2">
        * Receita considera apenas shows com pagamento confirmado
      </p>
    </div>
  );
}
