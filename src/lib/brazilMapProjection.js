import brazilMap from '@svg-maps/brazil';

/** Limites geográficos calibrados com o viewBox do @svg-maps/brazil. */
const VIEWBOX_PARTS = brazilMap.viewBox.split(/\s+/).map(Number);

export const BOUNDS = {
  west: -73.99,
  east: -34.79,
  north: 5.27,
  south: -33.75,
  w: VIEWBOX_PARTS[2] || 613,
  h: VIEWBOX_PARTS[3] || 639,
};

export function latlngToSvg(lat, lng) {
  const x = ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * BOUNDS.w;
  const y = ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * BOUNDS.h;
  return { x, y };
}

/** Centróides geográficos (lat, lng) por UF — fallback para cidades sem GPS. */
export const STATE_GEO_CENTROIDS = {
  AC: [-9.02, -70.81], AL: [-9.57, -36.78], AM: [-4.13, -63.45], AP: [1.41, -51.77],
  BA: [-12.96, -41.70], CE: [-5.49, -39.32], DF: [-15.78, -47.93], ES: [-19.19, -40.34],
  GO: [-15.98, -49.86], MA: [-4.96, -45.27], MG: [-18.10, -44.38], MS: [-20.77, -54.79],
  MT: [-12.64, -55.42], PA: [-3.41, -51.98], PB: [-7.24, -36.78], PE: [-8.81, -36.95],
  PI: [-7.72, -42.72], PR: [-24.89, -51.55], RJ: [-22.25, -42.66], RN: [-5.81, -36.67],
  RO: [-10.83, -63.34], RR: [2.02, -61.38], RS: [-30.03, -53.00], SC: [-27.24, -50.22],
  SE: [-10.57, -37.45], SP: [-22.26, -48.17], TO: [-10.18, -48.33],
};

export const STATE_CENTROIDS = Object.fromEntries(
  Object.entries(STATE_GEO_CENTROIDS).map(([uf, [lat, lng]]) => [uf, latlngToSvg(lat, lng)])
);
