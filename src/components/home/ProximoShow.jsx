import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, User, ChevronRight, Navigation, CheckCircle2, Loader2, Circle } from 'lucide-react';
import appToast from '@/lib/appToast';

import { getCategoryConfig } from '@/lib/categoryConfig';
import { useCountdown } from '@/lib/useBackstageData';
import { hardNavigate } from '@/lib/hardNavigate';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ModoPalcoActions from '@/components/home/ModoPalcoActions';
import EventHeading from '@/components/events/EventHeading';
import { ClampedText, Ellipsis } from '@/components/ui/overflowText';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { useStatusToggle } from '@/lib/useStatusToggle';
import { useEvents } from '@/lib/useEvents';
import { captureEventLocationFromGps, mapsUrlForCoords } from '@/lib/eventLocation';

function getEventDateStr(event) {
  return event?.start_date || event?.event_date || null;
}

function eventHasLocation(event) {
  if (!event) return false;
  return Boolean(event.location?.trim()) || (event.location_lat != null && event.location_lng != null);
}

export default function ProximoShow({ event, userCategory, isOnStage, isLiveShift, isLoading, onViewEvent, onRefresh }) {
  const eventDateStr = getEventDateStr(event);
  const { countdown } = useCountdown(eventDateStr);
  const config = getCategoryConfig(userCategory);
  const gradientBg = { background: `linear-gradient(to right, ${config.primaryHex}, ${config.accentHex})` };
  const gradientText = {
    backgroundImage: `linear-gradient(to right, ${config.primaryHex}, ${config.accentHex})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };
  const primarySurface = {
    borderColor: `${config.primaryHex}66`,
    background: `${config.primaryHex}1a`,
    color: config.primaryHex,
  };
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
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = !live && eventDateStr === todayStr;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50"
      >
        <div className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
      </motion.div>
    );
  }

  if (!event) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-5 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 text-center"
      >
        <div className="text-6xl mb-4">🎭</div>
        <h2 className="text-2xl font-bold mb-2" style={gradientText}>
          Palco Limpo
        </h2>
        <p className="text-slate-400 mb-5">
          Desfrute da calma antes da tormenta. Seus próximos eventos aparecem aqui.
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => hardNavigate('/calendar?action=new-event')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow-lg transition-all"
          style={{ ...gradientBg, boxShadow: `0 8px 24px ${config.primaryHex}30` }}
        >
          <Navigation className="w-4 h-4" />
          Criar próximo show
        </motion.button>
      </motion.div>
    );
  }

  const eventDate = eventDateStr ? parseISO(eventDateStr) : null;
  const formattedDate = eventDate && isValid(eventDate)
    ? format(eventDate, "EEEE, d 'de' MMMM", { locale: ptBR })
    : 'Data a definir';
  const formattedTime = event.start_time
    ? format(parseISO(`2000-01-01T${event.start_time}`), 'HH:mm', { locale: ptBR })
    : 'Horário a definir';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 rounded-2xl border-2 overflow-hidden ${
        live
          ? `bg-gradient-to-br from-slate-900 to-slate-800 ${config.borderGlow}`
          : isToday
          ? 'bg-gradient-to-br from-amber-950/20 to-slate-900/80 border-amber-500/40'
          : 'bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/30'
      }`}
    >
      {live && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"
        />
      )}
      {isToday && (
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
        />
      )}

      <div className="p-5 sm:p-8">
        {/* Header com Badge */}
        <div className="flex items-start justify-between mb-5 sm:mb-6 gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="text-2xl sm:text-3xl flex-shrink-0">{config.emoji}</span>
              {live && (
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center gap-1"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  AO VIVO
                </motion.span>
              )}
              {isToday && (
                <motion.span
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold"
                >
                  HOJE
                </motion.span>
              )}
            </div>
            <EventHeading event={event} client={event.clients} size="lg" className="mb-2" />
            {event.client_id ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); hardNavigate(`/client-detail?id=${event.client_id}`); }}
                className="text-sm text-slate-400 transition-colors flex items-center gap-1.5 group max-w-full min-w-0 bp-hover-primary"
              >
                <User className="w-3 h-3 flex-shrink-0 bp-text-primary opacity-70 group-hover:opacity-100" />
                <Ellipsis as="span" className="text-left">Ver página do cliente</Ellipsis>
              </button>
            ) : (
              <p className="text-sm text-slate-500">Sem cliente vinculado</p>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 flex-shrink-0" style={{ color: config.primaryHex }} />
            <div className="text-sm">
              <p className="text-slate-500 text-xs">Horário</p>
              <p className="font-semibold">{formattedTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-amber-400" />
            <div className="text-sm">
              <p className="text-slate-500 text-xs">Local</p>
              <p className="font-semibold truncate">{event.location || 'Sem local'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            {event.status === 'confirmed'
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              : <Circle className="w-4 h-4" style={{ color: config.primaryHex }} />
            }
            <div className="text-sm">
              <p className="text-slate-500 text-xs">Status</p>
              <p className="font-semibold">
                {event.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
              </p>
            </div>
          </div>

          <div className="text-slate-300">
            <div className="text-sm">
              <p className="text-slate-500 text-xs">Cachê</p>
              <p className="font-semibold">
                {isVisible
                  ? formatCurrency(getEventCacheAmount(event))
                  : '•••••'}
              </p>
            </div>
          </div>
        </div>

        {isOnStage && (
          <div className="mb-6 space-y-3">
            <ModoPalcoActions event={event} accentColor={config.primaryHex} onRefresh={onRefresh} />
            {!eventHasLocation(event) && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={locationSaving}
                onClick={handleGpsCheckIn}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60"
                style={primarySurface}
              >
                {locationSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                Check-in no local (GPS)
              </motion.button>
            )}
          </div>
        )}

        {/* Countdown */}
        {countdown && !live && (
          <motion.div
            className="rounded-xl p-4 mb-6 border"
            style={isToday
              ? { background: `${config.primaryHex}12`, borderColor: `${config.primaryHex}40` }
              : { background: 'rgba(15,17,27,0.5)', borderColor: 'rgba(100,116,139,0.5)' }
            }
          >
            {isToday ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: config.primaryHex }}>Show hoje às</p>
                  <p className="text-3xl font-black text-white">{formattedTime}</p>
                </div>
                {countdown.hours >= 0 && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-0.5">faltam</p>
                    <p className="text-lg font-bold text-slate-300">
                      {countdown.hours > 0 ? `${countdown.hours}h ` : ''}{String(countdown.minutes).padStart(2, '0')}min
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2">ACONTECE EM</p>
                <div className="flex justify-center gap-4">
                  {countdown.days > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-black" style={{ color: config.primaryHex }}>{countdown.days}</div>
                      <div className="text-xs text-slate-500">dia{countdown.days !== 1 ? 's' : ''}</div>
                    </div>
                  )}
                  {(countdown.days > 0 || countdown.hours > 0) && (
                    <>
                      <div className="text-slate-600">:</div>
                      <div className="text-center">
                        <div className="text-2xl font-black" style={{ color: config.primaryHex }}>
                          {String(countdown.hours).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-500">horas</div>
                      </div>
                    </>
                  )}
                  {countdown.minutes >= 0 && (
                    <>
                      <div className="text-slate-600">:</div>
                      <div className="text-center">
                        <div className="text-2xl font-black" style={{ color: config.primaryHex }}>
                          {String(countdown.minutes).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-500">min</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Data */}
        <p className="text-sm text-slate-400 mb-6">{formattedDate.toUpperCase()}</p>

        {/* Descrição */}
        {event.description && (
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700/30 min-w-0">
            <ClampedText lines={4} className="text-sm text-slate-300">{event.description}</ClampedText>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewEvent ? onViewEvent(event) : hardNavigate('/calendar')}
            className="flex-1 min-w-[120px] px-4 py-3 rounded-lg text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            style={{ ...gradientBg, boxShadow: `0 4px 16px ${config.primaryHex}40` }}
          >
            <span>Ver Detalhes</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          {event.status === 'pending' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={toggling === event.id}
              onClick={() => confirmEvent(event, onRefresh)}
              className="px-4 py-3 rounded-lg border border-blue-500/40 bg-blue-900/20 text-blue-300 font-semibold hover:bg-blue-900/40 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {toggling === event.id
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle2 className="w-4 h-4" />
              }
              Confirmar
            </motion.button>
          )}

          {eventHasLocation(event) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const url = event.location_lat != null && event.location_lng != null
                  ? mapsUrlForCoords(event.location_lat, event.location_lng)
                  : `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
                window.open(url, '_blank');
              }}
              className="px-4 py-3 rounded-lg border border-slate-700 text-slate-300 font-semibold bp-hover-primary hover:bg-[color-mix(in_srgb,var(--bp-primary)_10%,transparent)] transition-all flex items-center gap-2"
            >
              <Navigation className="w-4 h-4 text-amber-400" />
              Rota
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
