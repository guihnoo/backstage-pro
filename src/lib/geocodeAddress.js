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
