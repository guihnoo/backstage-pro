import { Component, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPin } from 'lucide-react';
import brazilMap from '@svg-maps/brazil';
import {
  BRAZIL_STATE_NAMES,
  inferCityFromLocation,
  inferStateFromLocation,
  normalizeCityName,
  normalizeStateCode,
} from '@/lib/parseEventLocation';

class BrazilMapErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
          Mapa indisponível — recarregue a página.
        </div>
      );
    }
    return this.props.children;
  }
}

const STATE_NAMES = {
  ...BRAZIL_STATE_NAMES,
  ...Object.fromEntries(brazilMap.locations.map((loc) => [loc.id.toUpperCase(), loc.name])),
};

// Equirectangular projection — dimensões alinhadas ao viewBox real do pacote (@svg-maps/brazil v2)
const VIEWBOX_PARTS = brazilMap.viewBox.split(/\s+/).map(Number);
const BOUNDS = {
  west: -73.99,
  east: -28.85,
  north: 5.27,
  south: -33.75,
  w: VIEWBOX_PARTS[2] || 613,
  h: VIEWBOX_PARTS[3] || 639,
};

function latlngToSvg(lat, lng) {
  const x = (lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west) * BOUNDS.w;
  const y = (BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south) * BOUNDS.h;
  return { x, y };
}

// Approximate center coords for major Brazilian cities (fallback when no GPS)
const CITY_FALLBACK = {
  'São Paulo': [-23.55, -46.63],
  'Rio de Janeiro': [-22.91, -43.17],
  'Salvador': [-12.97, -38.50],
  'Fortaleza': [-3.72, -38.54],
  'Belo Horizonte': [-19.92, -43.93],
  'Manaus': [-3.10, -60.03],
  'Curitiba': [-25.43, -49.27],
  'Recife': [-8.05, -34.88],
  'Belém': [-1.46, -48.49],
  'Goiânia': [-16.69, -49.26],
  'Guarulhos': [-23.45, -46.53],
  'Campinas': [-22.91, -47.06],
  'São Luís': [-2.53, -44.30],
  'Maceió': [-9.67, -35.74],
  'Natal': [-5.79, -35.21],
  'Teresina': [-5.09, -42.80],
  'Campo Grande': [-20.47, -54.62],
  'João Pessoa': [-7.12, -34.85],
  'Aracaju': [-10.92, -37.05],
  'Cuiabá': [-15.60, -56.09],
  'Porto Alegre': [-30.03, -51.22],
  'Vitória': [-20.32, -40.31],
  'Florianópolis': [-27.60, -48.55],
  'Macapá': [0.04, -51.07],
  'Porto Velho': [-8.76, -63.90],
  'Rio Branco': [-9.98, -67.82],
  'Boa Vista': [2.82, -60.67],
  'Palmas': [-10.25, -48.32],
  'São José dos Campos': [-23.18, -45.89],
  'Ribeirão Preto': [-21.18, -47.81],
  'Uberlândia': [-18.91, -48.26],
  'Sorocaba': [-23.50, -47.46],
  'Feira de Santana': [-12.27, -38.97],
  'Joinville': [-26.30, -48.85],
  'Londrina': [-23.30, -51.17],
  'Santos': [-23.96, -46.33],
  'Niterói': [-22.88, -43.10],
  'Pelotas': [-31.77, -52.34],
  'Caxias do Sul': [-29.17, -51.18],
  'Montes Claros': [-16.73, -43.86],
  'Juiz de Fora': [-21.76, -43.35],
  'Foz do Iguaçu': [-25.55, -54.59],
  'Osasco': [-23.53, -46.79],
  'Maringá': [-23.43, -51.94],
  'Mogi das Cruzes': [-23.52, -46.19],
  'Contagem': [-19.93, -44.05],
  'Piracicaba': [-22.73, -47.65],
  'Porto Seguro': [-16.44, -39.06],
  'Macaé': [-22.38, -41.79],
  'Ilhéus': [-14.79, -39.05],
  'Barueri': [-23.51, -46.88],
  'Ananindeua': [-1.37, -48.37],
  'Aparecida de Goiânia': [-16.82, -49.24],
  'São Bernardo do Campo': [-23.69, -46.56],
  'Santo André': [-23.66, -46.53],
  'São José do Rio Preto': [-20.82, -49.38],
  'Cascavel': [-24.96, -53.46],
  'Uberaba': [-19.75, -47.93],
  'Ponta Grossa': [-25.09, -50.16],
  'Caruaru': [-8.28, -35.97],
  'Petrolina': [-9.39, -40.50],
  'Juazeiro do Norte': [-7.21, -39.31],
  'Mossoró': [-5.19, -37.34],
  'Caucaia': [-3.73, -38.66],
  'Anápolis': [-16.33, -48.95],
  'Rondonópolis': [-16.47, -54.64],
  'Ji-Paraná': [-10.88, -61.95],
  'Santarém': [-2.44, -54.71],
  'Imperatriz': [-5.53, -47.47],
  'Camaçari': [-12.70, -38.32],
  'Lauro de Freitas': [-12.90, -38.33],
  'Vitória da Conquista': [-14.87, -40.84],
  'Blumenau': [-26.92, -49.07],
  'Limeira': [-22.56, -47.40],
  'Marabá': [-5.36, -49.12],
  'São José': [-27.61, -48.62],
  'Bauru': [-22.31, -49.07],
  'Franca': [-20.54, -47.40],
  'Presidente Prudente': [-22.12, -51.39],
};

function stripAccents(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function lookupCityCoords(cityName) {
  if (!cityName) return null;
  const target = stripAccents(cityName).toLowerCase();
  for (const [name, coords] of Object.entries(CITY_FALLBACK)) {
    if (stripAccents(name).toLowerCase() === target) return coords;
  }
  return null;
}

/** Centro aproximado de cada UF a partir do path SVG */
function pathCentroid(pathD) {
  const nums = pathD.match(/-?\d+\.?\d*/g)?.map(Number) || [];
  if (nums.length < 2) return null;
  let sumX = 0;
  let sumY = 0;
  let pairs = 0;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    sumX += nums[i];
    sumY += nums[i + 1];
    pairs += 1;
  }
  if (!pairs) return null;
  return { x: sumX / pairs, y: sumY / pairs };
}

const STATE_CENTROIDS = Object.fromEntries(
  brazilMap.locations.map((loc) => [loc.id.toUpperCase(), pathCentroid(loc.path)])
);

function jitterFromKey(key, base, spread = 14) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const angle = ((hash % 360) * Math.PI) / 180;
  const radius = (Math.abs(hash) % spread) + 5;
  return {
    x: base.x + Math.cos(angle) * radius,
    y: base.y + Math.sin(angle) * radius,
  };
}

function resolveCityCoords({ cityName, uf, cityKey, lat, lng }) {
  if (lat != null && lng != null) {
    return latlngToSvg(Number(lat), Number(lng));
  }
  const fallback = lookupCityCoords(cityName);
  if (fallback) return latlngToSvg(fallback[0], fallback[1]);
  if (uf && STATE_CENTROIDS[uf]) {
    return jitterFromKey(cityKey, STATE_CENTROIDS[uf]);
  }
  return null;
}

function eventTitle(ev) {
  return ev.title || ev.name || ev.client_name || 'Evento';
}

function BrazilVisitedMapInner({ events = [] }) {
  const [activeUf, setActiveUf] = useState(null);
  const [pinnedCityKey, setPinnedCityKey] = useState(null);
  const [hoverCityKey, setHoverCityKey] = useState(null);

  const { visited, countsByState, cities, citiesByState, latestCityKey, sortedCityEntries } = useMemo(() => {
    const stateSet = new Set();
    const stateCounts = {};
    const cityMap = {};
    const byState = {};
    let latestDate = null;
    let latestKey = null;

    for (const ev of events) {
      if (ev.status === 'cancelado') continue;

      let uf = normalizeStateCode(ev.location_state);
      if (!uf) uf = inferStateFromLocation(ev.location);

      if (uf) {
        stateSet.add(uf);
        stateCounts[uf] = (stateCounts[uf] || 0) + 1;
      }

      let cityName = normalizeCityName(
        ev.location_city || inferCityFromLocation(ev.location) || ''
      );
      if (!cityName && uf) {
        cityName = STATE_NAMES[uf] || uf;
      }
      if (!cityName && !uf) continue;

      const cityKey = uf ? `${uf}:${cityName}` : cityName;
      const evDate = ev.start_date || ev.end_date || null;

      const coords = resolveCityCoords({
        cityName,
        uf,
        cityKey,
        lat: ev.location_lat,
        lng: ev.location_lng,
      });

      if (!cityMap[cityKey]) {
        cityMap[cityKey] = {
          key: cityKey,
          name: cityName,
          uf,
          coords,
          count: 0,
          lastDate: null,
          events: [],
        };
      }
      cityMap[cityKey].count += 1;
      cityMap[cityKey].events.push({
        id: ev.id,
        title: eventTitle(ev),
        date: evDate,
      });
      if (evDate && (!cityMap[cityKey].lastDate || evDate > cityMap[cityKey].lastDate)) {
        cityMap[cityKey].lastDate = evDate;
      }
      if (coords && !cityMap[cityKey].coords) {
        cityMap[cityKey].coords = coords;
      }

      if (uf) {
        if (!byState[uf]) byState[uf] = [];
        if (!byState[uf].includes(cityKey)) byState[uf].push(cityKey);
      }

      if (evDate && (!latestDate || evDate > latestDate)) {
        latestDate = evDate;
        latestKey = cityKey;
      }
    }

    for (const entry of Object.values(cityMap)) {
      if (!entry.coords) {
        entry.coords = resolveCityCoords({
          cityName: entry.name,
          uf: entry.uf,
          cityKey: entry.key,
        });
      }
      entry.events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    const sortedCityEntries = Object.entries(cityMap).sort(
      (a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name, 'pt-BR')
    );

    return {
      visited: stateSet,
      countsByState: stateCounts,
      cities: cityMap,
      citiesByState: byState,
      latestCityKey: latestKey,
      sortedCityEntries,
    };
  }, [events]);

  const totalStates = brazilMap.locations.length;
  const stateCount = visited.size;
  const cityCount = Object.keys(cities).length;
  const pct = Math.round((stateCount / totalStates) * 100);
  const focus = activeUf && visited.has(activeUf) ? activeUf : null;

  const focusCities = focus && citiesByState[focus]
    ? citiesByState[focus].map((k) => cities[k]).filter(Boolean).sort((a, b) => b.count - a.count)
    : [];

  const activeCityKey = pinnedCityKey || hoverCityKey;
  const activeCityData = activeCityKey ? cities[activeCityKey] : null;

  const listFilterUf = focus;
  const visibleCityEntries = listFilterUf
    ? sortedCityEntries.filter(([, c]) => c.uf === listFilterUf)
    : sortedCityEntries;

  const cityDots = Object.entries(cities).filter(([, c]) => c.coords);

  const selectCity = (key) => {
    setPinnedCityKey((prev) => (prev === key ? null : key));
    const city = cities[key];
    if (city?.uf) setActiveUf(city.uf);
  };

  const selectState = (uf) => {
    setPinnedCityKey(null);
    setActiveUf((prev) => (prev === uf ? null : uf));
  };

  return (
    <div
      className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4"
      data-tour="reports-map"
      data-testid="brazil-visited-map"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1 gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Map className="w-4 h-4 text-cyan-400" />
          Mapa interativo — onde você trabalhou
        </h3>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-cyan-300">{stateCount}/{totalStates} estados · {pct}%</span>
          {cityCount > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-violet-300">{cityCount} {cityCount === 1 ? 'cidade' : 'cidades'}</span>
            </>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">
        Estados e cidades com eventos cadastrados. Toque no mapa ou na lista para ver detalhes.
      </p>

      {/* SVG Map */}
      <div className="relative">
        <svg
          viewBox={brazilMap.viewBox}
          className="w-full h-auto max-h-[min(52vh,360px)] mx-auto"
          role="img"
          aria-label="Mapa interativo do Brasil com estados e cidades visitadas"
        >
          {/* State fills */}
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
                onMouseLeave={() => !pinnedCityKey && setActiveUf(null)}
                onFocus={() => active && setActiveUf(uf)}
                onBlur={() => !pinnedCityKey && setActiveUf(null)}
                onClick={() => active && selectState(uf)}
                tabIndex={active ? 0 : -1}
                aria-label={`${loc.name}${active ? `, ${countsByState[uf]} evento(s)` : ', não visitado'}`}
              />
            );
          })}

          {/* City dots */}
          {cityDots.map(([key, city]) => {
            const { x, y } = city.coords;
            const isLatest = key === latestCityKey;
            const isActiveCity = key === activeCityKey;
            const r = Math.min(8, 3 + Math.log2(city.count + 1));

            return (
              <g
                key={key}
                onMouseEnter={() => setHoverCityKey(key)}
                onMouseLeave={() => setHoverCityKey(null)}
                onClick={() => selectCity(key)}
                className="cursor-pointer"
                style={{ isolation: 'isolate' }}
              >
                {/* Pulse ring for latest / focused */}
                {(isLatest || isActiveCity) && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={r + 4}
                    fill="none"
                    stroke={isLatest ? 'rgba(167,139,250,0.6)' : 'rgba(34,211,238,0.5)'}
                    strokeWidth={1}
                    animate={{ r: [r + 3, r + 7, r + 3], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {/* Outer glow */}
                <circle
                  cx={x}
                  cy={y}
                  r={r + 2}
                  fill={isLatest ? 'rgba(139,92,246,0.25)' : 'rgba(34,211,238,0.15)'}
                />
                {/* Main dot */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={isLatest ? 'rgba(167,139,250,0.95)' : 'rgba(34,211,238,0.92)'}
                  animate={isActiveCity ? { r: r * 1.4 } : { r }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  style={{ filter: `drop-shadow(0 0 ${r * 1.2}px ${isLatest ? '#a78bfa' : '#22d3ee'})` }}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip: cidade selecionada ou em hover */}
        <AnimatePresence>
          {activeCityData && (
            <motion.div
              key="city-tip"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-2 left-2 right-2 sm:left-auto sm:right-2 sm:w-64 max-h-40 overflow-y-auto rounded-lg border border-cyan-500/30 bg-slate-950/95 backdrop-blur px-3 py-2 text-xs pointer-events-none"
            >
              <p className="font-semibold text-white">{activeCityData.name}</p>
              {activeCityData.uf && (
                <p className="text-slate-400 text-[10px]">{STATE_NAMES[activeCityData.uf] || activeCityData.uf}</p>
              )}
              <p className="text-cyan-300 mt-0.5">
                {activeCityData.count} evento{activeCityData.count === 1 ? '' : 's'}
              </p>
              {activeCityData.lastDate && (
                <p className="text-slate-500 text-[10px] mt-0.5">
                  Última vez:{' '}
                  {new Date(activeCityData.lastDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
              {activeCityKey === latestCityKey && (
                <p className="text-violet-400 text-[10px] mt-0.5">Mais recente</p>
              )}
              {activeCityData.events?.length > 0 && (
                <ul className="mt-2 pt-2 border-t border-slate-700/60 space-y-1">
                  {activeCityData.events.slice(0, 4).map((item) => (
                    <li key={item.id || item.title} className="text-slate-300 truncate">
                      {item.title}
                    </li>
                  ))}
                  {activeCityData.events.length > 4 && (
                    <li className="text-slate-500 text-[10px]">
                      +{activeCityData.events.length - 4} evento(s)
                    </li>
                  )}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip: state hover (with cities list) */}
        <AnimatePresence>
          {focus && (
            <motion.div
              key="state-tip"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute bottom-2 left-2 right-2 sm:left-auto sm:right-2 sm:w-60 rounded-lg border border-cyan-500/30 bg-slate-950/90 backdrop-blur px-3 py-2.5 text-xs"
            >
              <p className="font-semibold text-cyan-200">{STATE_NAMES[focus]}</p>
              <p className="text-slate-400 mt-0.5">
                {countsByState[focus]} evento{countsByState[focus] === 1 ? '' : 's'}
              </p>
              {focusCities.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Cidades</p>
                  {focusCities.slice(0, 6).map((c) => (
                    <div key={c.name} className="flex items-center justify-between gap-2">
                      <span className="text-white truncate">{c.name}</span>
                      <span className="text-cyan-400 flex-shrink-0 font-mono">{c.count}×</span>
                    </div>
                  ))}
                  {focusCities.length > 6 && (
                    <p className="text-slate-500 text-[10px]">+{focusCities.length - 6} mais</p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      {(stateCount > 0 || cityCount > 0) && (
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(34,211,238,0.42)', border: '1px solid rgba(34,211,238,0.6)' }} />
            <span className="text-[11px] text-slate-400">Estado visitado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,211,238,0.92)', boxShadow: '0 0 5px #22d3ee' }} />
            <span className="text-[11px] text-slate-400">Cidade</span>
          </div>
          {latestCityKey && cities[latestCityKey] && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(167,139,250,0.92)', boxShadow: '0 0 5px #a78bfa' }} />
              <span className="text-[11px] text-slate-400">Mais recente</span>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {stateCount === 0 && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-800/30 p-4 text-center">
          <MapPin className="w-5 h-5 text-cyan-500/60" />
          <p className="text-sm text-slate-300 font-medium">
            {events.length === 0
              ? 'Nenhum evento cadastrado ainda.'
              : 'Seus eventos ainda não têm localização.'}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            {events.length === 0
              ? 'Adicione eventos com cidade/estado para ver o mapa iluminado.'
              : 'Edite seus eventos e preencha o campo "Local" com cidade e estado (ex: São Paulo, SP) para os estados aparecerem no mapa.'}
          </p>
        </div>
      )}

      {/* Lista interativa de cidades */}
      {cityCount > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-700/40">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
              {listFilterUf
                ? `Cidades em ${STATE_NAMES[listFilterUf] || listFilterUf}`
                : 'Suas cidades'}
            </p>
            {listFilterUf && (
              <button
                type="button"
                onClick={() => setActiveUf(null)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300"
              >
                Ver todas
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {visibleCityEntries.map(([key, city]) => {
              const isSelected = pinnedCityKey === key;
              const isLatest = key === latestCityKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectCity(key)}
                  className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                    isSelected
                      ? 'border-cyan-500/60 bg-cyan-500/10'
                      : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{city.name}</p>
                      {city.uf && (
                        <p className="text-[10px] text-slate-500">{STATE_NAMES[city.uf] || city.uf}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 flex-shrink-0">{city.count}×</span>
                  </div>
                  {isLatest && (
                    <span className="text-[10px] text-violet-400 mt-1 inline-block">Mais recente</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrazilVisitedMap(props) {
  return (
    <BrazilMapErrorBoundary>
      <BrazilVisitedMapInner {...props} />
    </BrazilMapErrorBoundary>
  );
}
