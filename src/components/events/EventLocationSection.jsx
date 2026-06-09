import { useState } from 'react';
import { MapPin, Navigation, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LocationAutocomplete from '@/components/events/LocationAutocomplete';
import { captureEventLocationFromGps, mapsUrlForCoords } from '@/lib/eventLocation';
import { toast } from 'sonner';

/**
 * Seção de local do evento: busca por endereço OU check-in GPS no local.
 */
export default function EventLocationSection({
  location = '',
  location_city = '',
  location_state = '',
  location_lat = null,
  location_lng = null,
  onChange,
  onGpsCaptured,
  showLabel = true,
  compact = false,
}) {
  const [gpsLoading, setGpsLoading] = useState(false);

  const applyPatch = (patch) => {
    onChange?.(patch);
  };

  const handleGpsCheckIn = async () => {
    setGpsLoading(true);
    try {
      const captured = await captureEventLocationFromGps();
      applyPatch({
        location: captured.location,
        location_city: captured.location_city,
        location_state: captured.location_state,
        location_lat: captured.location_lat,
        location_lng: captured.location_lng,
      });
      onGpsCaptured?.(captured);
      const accuracyNote =
        captured.accuracy != null
          ? ` Precisão ~${Math.round(captured.accuracy)}m.`
          : '';
      toast.success('Local registrado via GPS', {
        description: `${(captured.label || captured.location || '').slice(0, 72)}${accuracyNote}`,
      });
    } catch (err) {
      toast.error(err.message || 'Não foi possível registrar o local.');
    } finally {
      setGpsLoading(false);
    }
  };

  const mapsUrl = mapsUrlForCoords(location_lat, location_lng);

  return (
    <div className={`space-y-2 ${compact ? '' : ''}`}>
      {showLabel && (
        <Label className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          Local do evento
          <span className="text-slate-500 font-normal text-xs">(opcional)</span>
        </Label>
      )}

      <LocationAutocomplete
        value={location}
        onChange={(text) => applyPatch({ location: text })}
        onSelect={(item) =>
          applyPatch({
            location: item.location,
            location_city: item.city || location_city,
            location_state: item.stateCode || item.state || location_state,
            location_lat: item.lat,
            location_lng: item.lng,
          })
        }
        placeholder="Endereço, venue ou cidade do evento"
      />

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGpsCheckIn}
          disabled={gpsLoading}
          className="border-cyan-700/50 text-cyan-300 hover:bg-cyan-950/40 h-10 min-h-[44px] justify-start"
        >
          {gpsLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          Check-in no local (GPS)
        </Button>

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 px-2 py-2 min-h-[44px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir no mapa
          </a>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Você pode informar o endereço agora ou registrar a posição exata quando estiver no local do evento.
        {location_lat != null && location_lng != null && (
          <span className="block text-slate-600 mt-0.5 font-mono">
            {location_lat.toFixed(5)}, {location_lng.toFixed(5)}
            {location_state ? ` · ${location_state}` : ''}
          </span>
        )}
      </p>
    </div>
  );
}
