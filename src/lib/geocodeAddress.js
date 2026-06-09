const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Busca sugestões de endereço via Nominatim (OpenStreetMap).
 * Uso responsável: debounce no componente, countrycodes=br.
 */
export async function searchAddressSuggestions(query, { limit = 5 } = {}) {
  const q = String(query || '').trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'br',
    'accept-language': 'pt-BR',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': 'BackstagePro/1.0 (event-location)' },
  });
  if (!res.ok) return [];

  const data = await res.json();
  return (data || []).map((item) => ({
    id: String(item.place_id),
    label: item.display_name,
    location: item.display_name,
    city: item.address?.city || item.address?.town || item.address?.municipality || item.address?.village || '',
    state: item.address?.state || '',
    stateCode: item.address?.['ISO3166-2-lvl4']?.replace('BR-', '') || '',
    lat: item.lat ? Number(item.lat) : null,
    lng: item.lon ? Number(item.lon) : null,
  }));
}

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

function mapNominatimAddress(item) {
  if (!item) return null;
  const address = item.address || {};
  return {
    label: item.display_name,
    location: item.display_name,
    city:
      address.city ||
      address.town ||
      address.municipality ||
      address.village ||
      address.suburb ||
      '',
    state: address.state || '',
    stateCode: address['ISO3166-2-lvl4']?.replace('BR-', '') || '',
    lat: item.lat ? Number(item.lat) : null,
    lng: item.lon ? Number(item.lon) : null,
  };
}

/** Converte coordenadas GPS em endereço legível (Nominatim reverse). */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
    'accept-language': 'pt-BR',
  });

  const res = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
    headers: { 'User-Agent': 'BackstagePro/1.0 (event-location)' },
  });
  if (!res.ok) return null;

  const data = await res.json();
  return mapNominatimAddress(data);
}
