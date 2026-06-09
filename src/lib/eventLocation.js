import { getCurrentPosition } from '@/lib/geolocation';
import { reverseGeocode } from '@/lib/geocodeAddress';

/** Captura local exato via GPS + reverse geocode para persistir no evento. */
export async function captureEventLocationFromGps() {
  const pos = await getCurrentPosition();
  const place = await reverseGeocode(pos.lat, pos.lng);

  return {
    location:
      place?.location ||
      `Coordenadas: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`,
    location_city: place?.city || null,
    location_state: place?.stateCode || place?.state || null,
    location_lat: pos.lat,
    location_lng: pos.lng,
    accuracy: pos.accuracy,
    label: place?.label,
  };
}

export function mapsUrlForCoords(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
