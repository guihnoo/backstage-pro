import { useMemo, useState } from 'react';
import { format, subDays, startOfWeek, eachDayOfInterval, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function cellColor(count) {
  if (count === 0) return 'bg-slate-800/80';
  if (count === 1) return 'bg-cyan-900';
  if (count === 2) return 'bg-cyan-700';
  if (count === 3) return 'bg-cyan-500';
  return 'bg-cyan-300';
}

export default function ActivityHeatmap({ events = [] }) {
  const [tooltip, setTooltip] = useState(null);

  const { weeks, monthMarkers, totalDays, totalEvents } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = startOfWeek(subDays(today, 364), { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: startDay, end: today });

    // Count events per day
    const countByDay = {};
    for (const ev of events) {
      const d = (ev.start_date || '').slice(0, 10);
      if (d) countByDay[d] = (countByDay[d] || 0) + 1;
    }

    // Build week columns
    const weeksArr = [];
    let currentWeek = [];
    for (const day of allDays) {
      const dow = getDay(day); // 0=Sun
      if (dow === 0 && currentWeek.length > 0) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
      const iso = format(day, 'yyyy-MM-dd');
      currentWeek.push({ iso, day, count: countByDay[iso] || 0, isFuture: day > today });
    }
    if (currentWeek.length > 0) weeksArr.push(currentWeek);

    // Month markers: for each week, determine if month label should appear
    const seen = new Set();
    const markers = weeksArr.map((week, wi) => {
      const firstDay = week[0]?.day;
      if (!firstDay) return null;
      const m = firstDay.getMonth();
      if (seen.has(m)) return null;
      seen.add(m);
      return { wi, label: MONTHS_ABBR[m] };
    }).filter(Boolean);

    const total = Object.values(countByDay).reduce((s, c) => s + c, 0);
    const uniqueDays = Object.keys(countByDay).length;

    return { weeks: weeksArr, monthMarkers: markers, totalDays: uniqueDays, totalEvents: total };
  }, [events]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Atividade — últimos 12 meses</h3>
        <span className="text-xs text-slate-500">{totalEvents} show{totalEvents !== 1 ? 's' : ''} em {totalDays} dia{totalDays !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col justify-around mr-1" style={{ minWidth: 28 }}>
            {WEEK_LABELS.map((l, i) => (
              <span key={i} className={`text-[9px] text-slate-600 leading-none ${i % 2 === 0 ? 'invisible' : ''}`} style={{ height: 11 }}>
                {l}
              </span>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="relative">
            {/* Month labels row */}
            <div className="flex mb-1" style={{ height: 14 }}>
              {weeks.map((_, wi) => {
                const marker = monthMarkers.find(m => m.wi === wi);
                return (
                  <div key={wi} style={{ width: 13 }}>
                    {marker && (
                      <span className="text-[9px] text-slate-500 whitespace-nowrap">{marker.label}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cells grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {Array.from({ length: 7 }, (_, dow) => {
                    const cell = week.find(d => getDay(d.day) === dow);
                    if (!cell || cell.isFuture) {
                      return <div key={dow} style={{ width: 11, height: 11 }} className="rounded-[2px] bg-transparent" />;
                    }
                    return (
                      <div
                        key={dow}
                        style={{ width: 11, height: 11 }}
                        className={`rounded-[2px] cursor-default transition-opacity hover:opacity-80 ${cellColor(cell.count)}`}
                        onMouseEnter={() => setTooltip({ iso: cell.iso, count: cell.count })}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <p className="text-xs text-slate-400 h-4">
          {tooltip.count === 0
            ? `${format(parseISO(tooltip.iso), "d 'de' MMM yyyy", { locale: ptBR })} — sem shows`
            : `${format(parseISO(tooltip.iso), "d 'de' MMM yyyy", { locale: ptBR })} — ${tooltip.count} show${tooltip.count > 1 ? 's' : ''}`}
        </p>
      )}
      {!tooltip && <div className="h-4" />}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] text-slate-600">Menos</span>
        {[0, 1, 2, 3, 4].map(c => (
          <div key={c} style={{ width: 11, height: 11 }} className={`rounded-[2px] ${cellColor(c)}`} />
        ))}
        <span className="text-[10px] text-slate-600">Mais</span>
      </div>
    </div>
  );
}
