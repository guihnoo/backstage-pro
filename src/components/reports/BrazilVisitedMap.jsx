import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map } from 'lucide-react';
import brazilMap from '@svg-maps/brazil';

const STATE_NAMES = Object.fromEntries(
  brazilMap.locations.map((loc) => [loc.id.toUpperCase(), loc.name])
);

function inferStateFromLocation(location = '') {
  const text = String(location).toUpperCase();
  for (const uf of Object.keys(STATE_NAMES)) {
    if (new RegExp(`\\b${uf}\\b`).test(text)) return uf;
    const name = STATE_NAMES[uf]?.toUpperCase();
    if (name && text.includes(name)) return uf;
  }
  return null;
}

export default function BrazilVisitedMap({ events = [] }) {
  const [activeUf, setActiveUf] = useState(null);

  const { visited, countsByState } = useMemo(() => {
    const set = new Set();
    const counts = {};

    for (const ev of events) {
      let uf = ev.location_state?.toUpperCase() || null;
      if (!uf) uf = inferStateFromLocation(ev.location);
      if (!uf) continue;

      set.add(uf);
      counts[uf] = (counts[uf] || 0) + 1;
    }

    return { visited: set, countsByState: counts };
  }, [events]);

  const totalStates = brazilMap.locations.length;
  const count = visited.size;
  const pct = Math.round((count / totalStates) * 100);
  const focus = activeUf && visited.has(activeUf) ? activeUf : null;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Map className="w-4 h-4 text-cyan-400" />
          Mapa do Brasil — locais visitados
        </h3>
        <span className="text-xs text-cyan-300 font-mono whitespace-nowrap">
          {count}/{totalStates} estados · {pct}%
        </span>
      </div>

      <div className="relative">
        <svg
          viewBox={brazilMap.viewBox}
          className="w-full h-auto max-h-[min(52vh,360px)] mx-auto"
          role="img"
          aria-label="Mapa interativo do Brasil com estados visitados destacados"
        >
          {brazilMap.locations.map((loc) => {
            const uf = loc.id.toUpperCase();
            const active = visited.has(uf);
            const isFocus = focus === uf;

            return (
              <motion.path
                key={loc.id}
                d={loc.path}
                initial={false}
                animate={{
                  fill: active
                    ? isFocus
                      ? 'rgba(34, 211, 238, 0.55)'
                      : 'rgba(34, 211, 238, 0.28)'
                    : 'rgba(30, 41, 59, 0.75)',
                  stroke: active
                    ? isFocus
                      ? 'rgba(103, 232, 249, 1)'
                      : 'rgba(34, 211, 238, 0.65)'
                    : 'rgba(51, 65, 85, 0.9)',
                  strokeWidth: isFocus ? 1.4 : 0.8,
                }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer outline-none"
                onMouseEnter={() => active && setActiveUf(uf)}
                onMouseLeave={() => setActiveUf(null)}
                onFocus={() => active && setActiveUf(uf)}
                onBlur={() => setActiveUf(null)}
                onClick={() => active && setActiveUf((prev) => (prev === uf ? null : uf))}
                tabIndex={active ? 0 : -1}
                aria-label={`${loc.name}${active ? `, ${countsByState[uf]} evento(s)` : ', não visitado'}`}
              />
            );
          })}
        </svg>

        <AnimatePresence>
          {focus && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-2 left-2 right-2 sm:left-auto sm:right-2 sm:w-56 rounded-lg border border-cyan-500/30 bg-slate-950/90 backdrop-blur px-3 py-2 text-xs"
            >
              <p className="font-semibold text-cyan-200">{STATE_NAMES[focus]}</p>
              <p className="text-slate-400 mt-0.5">
                {countsByState[focus]} evento{countsByState[focus] === 1 ? '' : 's'} registrado
                {countsByState[focus] === 1 ? '' : 's'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {count === 0 ? (
        <p className="text-xs text-slate-500 mt-3 text-center">
          Adicione endereços nos eventos para iluminar os estados no mapa.
        </p>
      ) : (
        <p className="text-[11px] text-slate-500 mt-3 text-center">
          Toque ou passe o mouse nos estados iluminados para ver detalhes.
        </p>
      )}
    </div>
  );
}
