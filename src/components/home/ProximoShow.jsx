import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Navigation, CheckCircle2, Loader2, Plus } from 'lucide-react';
import appToast from '@/lib/appToast';
import { useCountdown } from '@/lib/useBackstageData';
import { hardNavigate } from '@/lib/hardNavigate';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ModoPalcoActions from '@/components/home/ModoPalcoActions';
import { ClampedText } from '@/components/ui/overflowText';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useStatusToggle } from '@/lib/useStatusToggle';
import { useEvents } from '@/lib/useEvents';
import { captureEventLocationFromGps, mapsUrlForCoords } from '@/lib/eventLocation';
import { todayLocalISO } from '@/components/utils/dateUtils';
import { getEventDisplay } from '@/lib/eventDisplay';

// Visual "All Access": a credencial amarela do próximo show.
const Y = '#ffd400';
const PINK = '#ff2e88';

function getEventDateStr(event) {
  return event?.start_date || event?.event_date || null;
}

function eventHasLocation(event) {
  if (!event) return false;
  return Boolean(event.location?.trim()) || (event.location_lat != null && event.location_lng != null);
}

const STATUS_LABELS = {
  confirmed: 'Confirmado',
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  pending: 'Pendente',
};

function InfoCell({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="font-tag text-[10px] font-bold tracking-[0.12em] opacity-70">{label}</p>
      <p className="text-[15px] font-extrabold leading-tight truncate">{children}</p>
    </div>
  );
}

function CountdownBox({ value, label }) {
  return (
    <div className="text-center min-w-[52px]">
      <div className="font-poster text-4xl leading-none" style={{ color: Y }}>{value}</div>
      <div className="font-tag text-[10px] text-[#a8a8a8] mt-1">{label}</div>
    </div>
  );
}

export default function ProximoShow({ event, isOnStage, isLiveShift, isLoading, loadError, onViewEvent, onCreateEvent, onRefresh }) {
  const eventDateStr = getEventDateStr(event);
  const { countdown } = useCountdown(eventDateStr);
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const { confirmEvent, toggling } = useStatusToggle();
  const { update: updateEvent } = useEvents();
  const [locationSaving, setLocationSaving] = useState(false);

  const handleGpsCheckIn = async () => {
    if (!event?.id || locationSaving) return;
    setLocationSaving(true);
    try {
      const captured = await captureEventLocationFromGps();
      await updateEvent(event.id, {
        location: captured.location,
        location_city: captured.location_city,
        location_state: captured.location_state,
        location_lat: captured.location_lat,
        location_lng: captured.location_lng,
      });
      appToast.success('Local registrado no evento', {
        description: (captured.label || captured.location || '').slice(0, 80),
      });
      onRefresh?.();
    } catch (err) {
      appToast.error(err.message || 'Não foi possível registrar o local.');
    } finally {
      setLocationSaving(false);
    }
  };

  const live = isOnStage || isLiveShift;
  const todayStr = todayLocalISO();
  const isToday = !live && eventDateStr === todayStr;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    );
  }

  // Falha ao carregar não é "agenda vazia": avisa e oferece tentar de novo.
  if (!event && loadError) {
    return (
      <div className="p-5 rounded-2xl bg-[#161616] text-center" style={{ border: `2px solid ${PINK}` }}>
        <h2 className="font-poster text-2xl tracking-wide mb-1" style={{ color: PINK }}>
          NÃO FOI POSSÍVEL CARREGAR SEUS EVENTOS
        </h2>
        <p className="text-[#c8c8c8] mb-4 text-sm">Confira a internet. Seus dados não foram perdidos.</p>
        <button
          type="button"
          onClick={() => onRefresh?.()}
          className="inline-flex items-center gap-2 px-5 min-h-[44px] rounded-full border border-[#333333] text-white text-sm font-extrabold"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-5 rounded-2xl text-center" style={{ border: '2px dashed #333333', background: '#121212' }}>
        <p className="font-tag text-[11px] tracking-[0.2em] text-[#a8a8a8]">SEM CREDENCIAL AINDA</p>
        <h2 className="font-poster text-3xl tracking-wide text-white mt-1 mb-1">NENHUM SHOW AGENDADO</h2>
        <p className="text-[#c8c8c8] mb-4 text-sm">Cadastre o próximo trabalho — sua diária padrão já vem preenchida.</p>
        <button
          type="button"
          onClick={() => (onCreateEvent ? onCreateEvent() : hardNavigate('/calendar?action=new-event'))}
          className="inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-full text-sm font-extrabold active:scale-95 transition-transform"
          style={{ background: Y, color: '#0a0a0a' }}
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Criar próximo show
        </button>
      </div>
    );
  }

  const eventDate = eventDateStr ? parseISO(eventDateStr) : null;
  const shortDate = eventDate && isValid(eventDate)
    ? format(eventDate, 'EEE d MMM', { locale: ptBR }).replace('.', '').toUpperCase()
    : 'DATA A DEFINIR';
  const formattedTime = event.start_time
    ? format(parseISO(`2000-01-01T${event.start_time}`), 'HH:mm', { locale: ptBR })
    : 'A definir';
  const { companyName, eventName, showEventSubtitle } = getEventDisplay(event, event.clients);
  const bigTitle = showEventSubtitle ? eventName : companyName;
  const tag = live
    ? (isLiveShift ? 'AO VIVO · TURNO ROLANDO' : `HOJE · ${shortDate}`)
    : isToday
      ? `HOJE · ${shortDate}`
      : `PRÓXIMO · ${shortDate}`;

  return (
    <div className="space-y-3">
      {/* Credencial amarela */}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => (onViewEvent ? onViewEvent(event) : hardNavigate('/calendar'))}
        aria-label={`Abrir ${bigTitle}`}
        className="relative w-full text-left rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
        style={{ background: Y, color: '#0a0a0a' }}
      >
        {/* furo do cordão da credencial */}
        <span aria-hidden="true" className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-2 rounded-full bg-[#0a0a0a]/80" />
        <div className="px-4 pt-7 pb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-tag text-[11px] font-bold tracking-[0.14em] flex items-center gap-1.5">
              {live && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: PINK }} />}
              {tag}
            </span>
            <span className="h-6 px-2 rounded-full bg-[#0a0a0a] font-tag text-[10px] font-bold flex items-center" style={{ color: Y }}>
              {(STATUS_LABELS[event.status] || 'Pendente').toUpperCase()}
            </span>
          </div>
          <h2 className="font-poster text-[34px] leading-[0.95] uppercase mt-2 break-words">{bigTitle}</h2>
          {showEventSubtitle && event.client_id && companyName !== 'Sem empresa' && (
            <p className="text-sm font-bold mt-1 truncate">{companyName}</p>
          )}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t-2 border-dashed border-[#0a0a0a]/25">
            <InfoCell label="HORÁRIO">{formattedTime}</InfoCell>
            <InfoCell label="LOCAL">{event.location_city || event.location || 'Sem local'}</InfoCell>
            <InfoCell label="CACHÊ">{isVisible ? formatCurrency(getEventCacheAmount(event)) : '•••••'}</InfoCell>
          </div>
        </div>
        <div className="h-3" style={{ background: 'repeating-linear-gradient(90deg, #0a0a0a 0 14px, transparent 14px 20px)' }} />
      </motion.button>

      {isOnStage && (
        <div className="space-y-3">
          <ModoPalcoActions event={event} accentColor={Y} onRefresh={onRefresh} />
          {!eventHasLocation(event) && (
            <button
              type="button"
              disabled={locationSaving}
              onClick={handleGpsCheckIn}
              className="w-full flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-full font-extrabold text-sm disabled:opacity-60"
              style={{ border: `1px solid ${Y}`, color: Y }}
            >
              {locationSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              Marcar o local pelo GPS
            </button>
          )}
        </div>
      )}

      {/* Contagem regressiva */}
      {countdown && !live && (
        <div className="rounded-2xl bg-[#161616] px-4 py-3 flex items-center justify-between gap-3">
          <p className="font-tag text-[11px] tracking-[0.14em] text-[#a8a8a8]">{isToday ? 'SHOW HOJE ÀS' : 'ACONTECE EM'}</p>
          {isToday ? (
            <div className="flex items-baseline gap-3">
              <span className="font-poster text-4xl leading-none text-white">{formattedTime}</span>
              {countdown.hours >= 0 && (
                <span className="font-tag text-xs text-[#a8a8a8]">
                  faltam {countdown.hours > 0 ? `${countdown.hours}h ` : ''}{String(countdown.minutes).padStart(2, '0')}min
                </span>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {countdown.days > 0 && <CountdownBox value={countdown.days} label={countdown.days !== 1 ? 'dias' : 'dia'} />}
              {(countdown.days > 0 || countdown.hours > 0) && <CountdownBox value={String(countdown.hours).padStart(2, '0')} label="horas" />}
              {countdown.minutes >= 0 && <CountdownBox value={String(countdown.minutes).padStart(2, '0')} label="min" />}
            </div>
          )}
        </div>
      )}

      {event.description && (
        <div className="rounded-2xl px-4 py-3 border border-dashed border-[#333333] min-w-0">
          <ClampedText lines={3} className="text-sm text-[#c8c8c8]">{event.description}</ClampedText>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => (onViewEvent ? onViewEvent(event) : hardNavigate('/calendar'))}
          className="flex-1 min-w-[120px] min-h-[48px] px-4 rounded-full font-extrabold text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
          style={{ background: Y, color: '#0a0a0a' }}
        >
          Ver detalhes
          <ChevronRight className="w-4 h-4" />
        </button>

        {(event.status === 'pending' || event.status === 'scheduled') && (
          <button
            type="button"
            disabled={toggling === event.id}
            onClick={() => confirmEvent(event, onRefresh)}
            className="min-h-[48px] px-4 rounded-full border border-[#333333] text-white font-extrabold text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {toggling === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirmar
          </button>
        )}

        {eventHasLocation(event) && (
          <button
            type="button"
            onClick={() => {
              const url = event.location_lat != null && event.location_lng != null
                ? mapsUrlForCoords(event.location_lat, event.location_lng)
                : `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
              window.open(url, '_blank');
            }}
            className="min-h-[48px] px-4 rounded-full border border-[#333333] text-white font-extrabold text-sm flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" style={{ color: Y }} />
            Rota
          </button>
        )}

        {event.client_id && (
          <button
            type="button"
            onClick={() => hardNavigate(`/client-detail?id=${event.client_id}`)}
            className="min-h-[48px] px-4 rounded-full border border-[#333333] text-[#c8c8c8] font-extrabold text-sm"
          >
            Cliente
          </button>
        )}
      </div>
    </div>
  );
}
