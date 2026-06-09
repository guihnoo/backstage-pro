import { useMemo } from 'react';
import { Map } from 'lucide-react';

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const STATE_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba',
  PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

function inferStateFromLocation(location = '') {
  const text = String(location).toUpperCase();
  for (const uf of BRAZIL_STATES) {
    if (new RegExp(`\\b${uf}\\b`).test(text)) return uf;
    const name = STATE_NAMES[uf]?.toUpperCase();
    if (name && text.includes(name)) return uf;
  }
  return null;
}

export default function BrazilVisitedMap({ events = [] }) {
  const visited = useMemo(() => {
    const set = new Set();
    for (const ev of events) {
      if (ev.location_state) set.add(ev.location_state.toUpperCase());
      else {
        const fromLoc = inferStateFromLocation(ev.location);
        if (fromLoc) set.add(fromLoc);
      }
    }
    return set;
  }, [events]);

  const count = visited.size;
  const pct = Math.round((count / BRAZIL_STATES.length) * 100);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Map className="w-4 h-4 text-cyan-400" />
          Mapa do Brasil — locais visitados
        </h3>
        <span className="text-xs text-cyan-300 font-mono">{count}/{BRAZIL_STATES.length} estados · {pct}%</span>
      </div>
      <div className="grid grid-cols-9 sm:grid-cols-9 gap-1">
        {BRAZIL_STATES.map((uf) => {
          const active = visited.has(uf);
          return (
            <div
              key={uf}
              title={STATE_NAMES[uf]}
              className={`aspect-square rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-bold transition-all ${
                active
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                  : 'bg-slate-800/60 text-slate-600 border border-slate-700/40'
              }`}
            >
              {uf}
            </div>
          );
        })}
      </div>
      {count === 0 && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          Adicione endereços nos eventos para iluminar os estados no mapa.
        </p>
      )}
    </div>
  );
}
