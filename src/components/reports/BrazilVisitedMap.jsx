import { Component, useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPin, HelpCircle } from 'lucide-react';
import brazilMap from '@svg-maps/brazil';
import {
  BRAZIL_STATE_NAMES,
  inferCityFromLocation,
  inferStateFromLocation,
  normalizeCityName,
  normalizeStateCode,
} from '@/lib/parseEventLocation';
import { latlngToSvg, STATE_CENTROIDS } from '@/lib/brazilMapProjection';
import { requestMapTour } from '@/lib/appTourBus';
import { isCancelledEvent } from '@/lib/eventFinance';
import { Link } from 'react-router-dom';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import {
  buildClientMap,
  getEventDisplay,
  resolveClientForEvent,
} from '@/lib/eventDisplay';

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

function eventLabel(ev, clientMap) {
  const client = resolveClientForEvent(ev, clientMap);
  const { companyName, eventName, showEventSubtitle } = getEventDisplay(ev, client);
  if (showEventSubtitle) return `${companyName} · ${eventName}`;
  return companyName;
}

function hexToRgb(hex) {
  const h = String(hex || '#A64AFF').replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbaHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function BrazilVisitedMapInner({ events = [], clients = [] }) {
  const theme = useCategoryTheme();
  const primary = theme.primaryHex;
  const accent = theme.accentHex;
  const clientMap = useMemo(() => buildClientMap(clients), [clients]);
  const [activeUf, setActiveUf] = useState(null);
  const [pinnedCityKey, setPinnedCityKey] = useState(null);
  const [hoverCityKey, setHoverCityKey] = useState(null);

  const activeEvents = useMemo(
    () => events.filter((ev) => !isCancelledEvent(ev)),
    [events]
  );

  const { visited, countsByState, cities, citiesByState, latestCityKey, sortedCityEntries } = useMemo(() => {
    const stateSet = new Set();
    const stateCounts = {};
    const cityMap = {};
    const byState = {};
    let latestDate = null;
    let latestKey = null;

    for (const ev of events) {
      if (isCancelledEvent(ev)) continue;

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
        title: eventLabel(ev, clientMap),
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
  }, [events, clientMap]);

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

  const cityListRef = useRef(null);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const SVG_W = 613, SVG_H = 639;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const vbW = SVG_W / zoom;
  const vbH = SVG_H / zoom;
  const dynamicViewBox = `${pan.x} ${pan.y} ${vbW} ${vbH}`;

  const zoomAt = useCallback((newZoom, cx, cy) => {
    const z = Math.max(1, Math.min(6, newZoom));
    const w = SVG_W / z;
    const h = SVG_H / z;
    setZoom(z);
    setPan({
      x: Math.max(0, Math.min(cx - w / 2, SVG_W - w)),
      y: Math.max(0, Math.min(cy - h / 2, SVG_H - h)),
    });
  }, []);

  const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.6 : -0.6;
    zoomAt(zoom + delta, pan.x + vbW / 2, pan.y + vbH / 2);
  }, [zoom, pan.x, pan.y, vbW, vbH, zoomAt]);
  // ──────────────────────────────────────────────────────────────────────────

  const selectCity = (key) => {
    const isDeselect = pinnedCityKey === key;
    setPinnedCityKey(isDeselect ? null : key);
    const city = cities[key];
    if (isDeselect) {
      if (city?.uf && STATE_CENTROIDS[city.uf]) {
        zoomAt(2.5, STATE_CENTROIDS[city.uf].x, STATE_CENTROIDS[city.uf].y);
      } else {
        resetZoom();
      }
      return;
    }
    if (city?.uf) setActiveUf(city.uf);
    if (city?.coords) zoomAt(4, city.coords.x, city.coords.y);
    requestAnimationFrame(() => {
      cityListRef.current
        ?.querySelector(`[data-city-key="${CSS.escape(key)}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };

  const selectState = (uf) => {
    setPinnedCityKey(null);
    if (activeUf === uf) {
      setActiveUf(null);
      resetZoom();
    } else {
      setActiveUf(uf);
      const c = STATE_CENTROIDS[uf];
      if (c) zoomAt(2.5, c.x, c.y);
    }
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
          <Map className="w-4 h-4" style={{ color: primary }} />
          Mapa interativo — onde você trabalhou
        </h3>
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap justify-end">
          <button
            type="button"
            onClick={() => requestMapTour()}
            className="inline-flex items-center gap-1 text-[10px] text-slate-500 transition-colors font-sans normal-case tracking-normal bp-hover-primary"
            aria-label="Como usar o mapa interativo"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Como usar
          </button>
          <span style={{ color: primary }}>{stateCount}/{totalStates} estados · {pct}%</span>
          {cityCount > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span style={{ color: accent }}>{cityCount} {cityCount === 1 ? 'cidade' : 'cidades'}</span>
            </>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">
        Estados e cidades com eventos cadastrados. Toque no mapa ou na lista para ver detalhes.
      </p>

      {/* SVG Map */}
      <div className="relative">
        {/* Controles de zoom */}
        {stateCount > 0 && (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => zoomAt(zoom + 0.8, pan.x + vbW / 2, pan.y + vbH / 2)}
              disabled={zoom >= 6}
              className="w-7 h-7 rounded-md bg-slate-800/90 border border-slate-600/60 text-slate-200 hover:text-white hover:bg-slate-700 text-base font-bold flex items-center justify-center backdrop-blur disabled:opacity-30 select-none"
              aria-label="Aproximar"
            >+</button>
            <button
              type="button"
              onClick={() => zoomAt(zoom - 0.8, pan.x + vbW / 2, pan.y + vbH / 2)}
              disabled={zoom <= 1}
              className="w-7 h-7 rounded-md bg-slate-800/90 border border-slate-600/60 text-slate-200 hover:text-white hover:bg-slate-700 text-base font-bold flex items-center justify-center backdrop-blur disabled:opacity-30 select-none"
              aria-label="Afastar"
            >−</button>
            {zoom > 1.05 && (
              <button
                type="button"
                onClick={resetZoom}
                className="w-7 h-7 rounded-md bg-slate-800/90 border border-slate-600/60 text-slate-400 hover:text-white hover:bg-slate-700 text-[9px] font-semibold flex items-center justify-center backdrop-blur select-none"
                aria-label="Ver Brasil completo"
              >fit</button>
            )}
          </div>
        )}
        <svg
          viewBox={dynamicViewBox}
          className="w-full h-auto max-h-[min(52vh,360px)] mx-auto"
          role="img"
          aria-label="Mapa interativo do Brasil com estados e cidades visitadas"
          onWheel={handleWheel}
          style={{ touchAction: 'none', cursor: zoom > 1 ? 'grab' : 'default' }}
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
                      ? rgbaHex(primary, 0.55)
                      : rgbaHex(primary, 0.28)
                    : 'rgba(30, 41, 59, 0.75)',
                  stroke: active
                    ? isFocus
                      ? rgbaHex(primary, 1)
                      : rgbaHex(primary, 0.65)
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
                    stroke={isLatest ? rgbaHex(accent, 0.6) : rgbaHex(primary, 0.5)}
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
                  fill={isLatest ? rgbaHex(accent, 0.25) : rgbaHex(primary, 0.15)}
                />
                {/* Main dot */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={isLatest ? rgbaHex(accent, 0.95) : `${primary}eb`}
                  animate={isActiveCity ? { r: r * 1.4 } : { r }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  style={{ filter: `drop-shadow(0 0 ${r * 1.2}px ${isLatest ? accent : primary})` }}
                />
              </g>
            );
          })}
        </svg>

      </div>

      {/* Painel de informações abaixo do mapa — sem sobreposição */}
      <AnimatePresence>
        {(activeCityData || focus) && (
          <motion.div
            key={activeCityData ? `city-${activeCityKey}` : `state-${focus}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mt-2 rounded-lg border bg-slate-900/80 px-3 py-2.5 text-xs"
            style={{ borderColor: `${primary}40` }}
          >
            {activeCityData ? (
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold text-white">{activeCityData.name}</span>
                    {activeCityData.uf && (
                      <span className="text-slate-400 text-[10px]">{STATE_NAMES[activeCityData.uf] || activeCityData.uf}</span>
                    )}
                    <span style={{ color: primary }}>{activeCityData.count} evento{activeCityData.count === 1 ? '' : 's'}</span>
                    {activeCityKey === latestCityKey && (
                      <span className="text-[10px]" style={{ color: accent }}>★ mais recente</span>
                    )}
                  </div>
                  {activeCityData.lastDate && (
                    <p className="text-slate-500 text-[10px]">
                      Última vez:{' '}
                      {new Date(activeCityData.lastDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  )}
                  {activeCityData.events?.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 flex flex-wrap gap-x-3 gap-y-0.5">
                      {activeCityData.events.slice(0, 6).map((item) => (
                        <span key={item.id || item.title} className="text-slate-300 truncate text-[11px]">{item.title}</span>
                      ))}
                      {activeCityData.events.length > 6 && (
                        <span className="text-slate-500 text-[10px]">+{activeCityData.events.length - 6} mais</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setPinnedCityKey(null); resetZoom(); }}
                  className="text-slate-500 hover:text-white flex-shrink-0 text-lg leading-none mt-[-2px]"
                  aria-label="Fechar"
                >×</button>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold" style={{ color: primary }}>{STATE_NAMES[focus]}</span>
                    <span className="text-slate-400">{countsByState[focus]} evento{countsByState[focus] === 1 ? '' : 's'}</span>
                  </div>
                  {focusCities.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-slate-700/50 flex flex-wrap gap-x-4 gap-y-0.5">
                      {focusCities.slice(0, 8).map((c) => (
                        <span key={c.name} className="text-[11px]">
                          <span className="text-white">{c.name}</span>
                          <span className="font-mono ml-1" style={{ color: primary }}>{c.count}×</span>
                        </span>
                      ))}
                      {focusCities.length > 8 && (
                        <span className="text-slate-500 text-[10px]">+{focusCities.length - 8} mais</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setActiveUf(null); resetZoom(); }}
                  className="text-slate-500 hover:text-white flex-shrink-0 text-lg leading-none mt-[-2px]"
                  aria-label="Fechar"
                >×</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      {(stateCount > 0 || cityCount > 0) && (
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: `${primary}6b`, border: `1px solid ${primary}99` }} />
            <span className="text-[11px] text-slate-400">Estado visitado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: `${primary}eb`, boxShadow: `0 0 5px ${primary}` }} />
            <span className="text-[11px] text-slate-400">Cidade</span>
          </div>
          {latestCityKey && cities[latestCityKey] && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: rgbaHex(accent, 0.92), boxShadow: `0 0 5px ${accent}` }} />
              <span className="text-[11px] text-slate-400">Mais recente</span>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {stateCount === 0 && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-800/30 p-4 text-center">
          <MapPin className="w-5 h-5" style={{ color: `${primary}99` }} />
          <p className="text-sm text-slate-300 font-medium">
            {activeEvents.length === 0
              ? events.length === 0
                ? 'Nenhum evento cadastrado ainda.'
                : 'Nenhum evento ativo no mapa.'
              : 'Seus eventos ainda não têm localização.'}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            {activeEvents.length === 0
              ? events.length === 0
                ? 'Adicione eventos com cidade/estado para ver o mapa iluminado.'
                : 'Eventos cancelados não aparecem aqui. Cadastre shows com local na Agenda.'
              : 'Edite seus eventos e preencha o campo "Local" com cidade e estado (ex: São Paulo, SP) para os estados aparecerem no mapa.'}
          </p>
          <Link
            to="/calendar"
            className="mt-1 text-xs font-medium transition-colors bp-hover-primary"
          >
            Ir para Agenda →
          </Link>
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
                className="text-[10px] bp-hover-primary transition-colors"
              >
                Ver todas
              </button>
            )}
          </div>
          <div
            ref={cityListRef}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1"
          >
            {visibleCityEntries.map(([key, city]) => {
              const isSelected = pinnedCityKey === key;
              const isLatest = key === latestCityKey;
              return (
                <button
                  key={key}
                  type="button"
                  data-city-key={key}
                  onClick={() => selectCity(key)}
                  className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                    isSelected
                      ? ''
                      : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600'
                  }`}
                  style={
                    isSelected
                      ? { borderColor: `${primary}99`, background: `${primary}1a` }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{city.name}</p>
                      {city.uf && (
                        <p className="text-[10px] text-slate-500">{STATE_NAMES[city.uf] || city.uf}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-mono flex-shrink-0" style={{ color: primary }}>{city.count}×</span>
                  </div>
                  {isLatest && (
                    <span className="text-[10px] mt-1 inline-block" style={{ color: accent }}>Mais recente</span>
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
