import { useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { getCategoryConfig, getCategoryLabel } from '@/lib/categoryConfig';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';

export default function CategoryBreakdown({ events = [], work = [] }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();

  const workByEvent = useMemo(() => {
    const map = {};
    work.forEach(w => {
      if (!w.event_id) return;
      if (!map[w.event_id]) map[w.event_id] = [];
      map[w.event_id].push(w);
    });
    return map;
  }, [work]);

  const categories = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (ev.status === 'cancelled') return;
      const cat = ev.category || 'audio';
      if (!map[cat]) map[cat] = { count: 0, revenue: 0, hours: 0, earned: 0 };
      map[cat].count++;

      // Receita: só eventos pagos
      if (ev.payment_status === 'paid') {
        const wk = workByEvent[ev.id] || [];
        const fromWork = wk.reduce((s, w) => s + (w.daily_cache || 0), 0);
        map[cat].revenue += fromWork > 0 ? fromWork : getEventCacheAmount(ev);
      }

      // Horas e cache de work records
      const wk = workByEvent[ev.id] || [];
      wk.forEach(w => {
        map[cat].hours += w.total_hours || 0;
        map[cat].earned += w.daily_cache || 0;
      });
    });

    return Object.entries(map)
      .map(([catId, d]) => {
        const cfg = getCategoryConfig(catId);
        const avg = d.count > 0 ? d.revenue / Math.max(d.count, 1) : 0;
        const hourlyRate = d.hours > 0 && d.earned > 0 ? d.earned / d.hours : null;
        return { catId, cfg, ...d, avg, hourlyRate };
      })
      .filter(c => c.count > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [events, workByEvent]);

  if (!categories.length) return null;

  const maxRevenue = Math.max(...categories.map(c => c.revenue), 1);

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white">Receita por Categoria</h3>
        <span className="text-xs text-slate-500 ml-1">— mostra apenas pagos</span>
      </div>

      <div className="space-y-3">
        {categories.map((c) => {
          const pct = maxRevenue > 0 ? (c.revenue / maxRevenue) * 100 : 0;
          const hex = c.cfg?.primaryHex || '#39FF14';
          return (
            <div key={c.catId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none flex-shrink-0">{c.cfg?.emoji || '🎤'}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-white truncate block">
                      {getCategoryLabel(c.catId)}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">{c.count} show{c.count !== 1 ? 's' : ''}</span>
                      {c.hourlyRate && (
                        <span className="text-[10px] text-amber-400/80">
                          {isVisible ? formatCurrency(c.hourlyRate) : '••••'}/h
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-xs font-bold text-white">
                    {c.revenue > 0
                      ? (isVisible ? formatCurrency(c.revenue) : '••••')
                      : <span className="text-slate-600 text-[10px]">sem pagos</span>}
                  </p>
                  {c.revenue > 0 && c.count > 0 && (
                    <p className="text-[10px] text-slate-500">
                      ø {isVisible ? formatCurrency(c.avg) : '••••'}
                    </p>
                  )}
                </div>
              </div>
              {/* Bar */}
              <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: hex,
                    opacity: c.revenue > 0 ? 0.8 : 0.25,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
