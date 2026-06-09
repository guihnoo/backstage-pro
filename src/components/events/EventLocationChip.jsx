import { MapPin, Navigation } from 'lucide-react';

/**
 * Indicador compacto de local no card/lista de eventos.
 */
export default function EventLocationChip({ event, className = '' }) {
  const hasCoords = event?.location_lat != null && event?.location_lng != null;
  const hasText = Boolean(event?.location?.trim());

  if (!hasText && !hasCoords) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-500 ${className}`}>
        <Navigation className="w-3 h-3 opacity-60" />
        Local não registrado
      </span>
    );
  }

  const label = hasText
    ? event.location
    : `${event.location_lat.toFixed(4)}, ${event.location_lng.toFixed(4)}`;

  return (
    <span className={`inline-flex items-start gap-1 text-xs text-slate-400 ${className}`} title={label}>
      <MapPin className={`w-3 h-3 mt-0.5 flex-shrink-0 ${hasCoords ? 'text-cyan-500' : 'text-slate-500'}`} />
      <span className="line-clamp-2 break-words">{label}</span>
    </span>
  );
}
