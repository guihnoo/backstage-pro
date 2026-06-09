import { motion } from 'framer-motion';
import { MapPin, Clock, User, ChevronRight, Navigation } from 'lucide-react';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { useCountdown } from '@/lib/useBackstageData';
import { hardNavigate } from '@/lib/hardNavigate';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ModoPalcoActions from '@/components/home/ModoPalcoActions';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { getEventCacheAmount } from '@/lib/eventFinance';

function getEventDateStr(event) {
  return event?.start_date || event?.event_date || null;
}

export default function ProximoShow({ event, userCategory, isOnStage, onViewEvent }) {
  const eventDateStr = getEventDateStr(event);
  const { countdown } = useCountdown(eventDateStr);
  const config = getCategoryConfig(userCategory);
  const { formatCurrency, isVisible } = useFinancialVisibility();

  if (!event) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-5 sm:p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 text-center"
      >
        <div className="text-6xl mb-4">🎭</div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Palco Limpo
        </h2>
        <p className="text-gray-400 mb-5">
          Desfrute da calma antes da tormenta. Seus próximos eventos aparecem aqui.
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => hardNavigate('/calendar')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
        >
          <Navigation className="w-4 h-4" />
          Criar próximo show
        </motion.button>
      </motion.div>
    );
  }

  const eventDate = parseISO(eventDateStr);
  const formattedDate = format(eventDate, "EEEE, d 'de' MMMM", { locale: ptBR });
  const formattedTime = event.start_time
    ? format(parseISO(`2000-01-01T${event.start_time}`), 'HH:mm', { locale: ptBR })
    : 'Horário a definir';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 rounded-2xl border-2 overflow-hidden ${
        isOnStage
          ? `bg-gradient-to-br from-gray-900 to-gray-800 ${config.borderGlow}`
          : 'bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-gray-700/30'
      }`}
    >
      {isOnStage && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"
        />
      )}

      <div className="p-5 sm:p-8">
        {/* Header com Badge */}
        <div className="flex items-start justify-between mb-5 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="text-2xl sm:text-3xl">{config.emoji}</span>
              {isOnStage && (
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center gap-1"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  AO VIVO
                </motion.span>
              )}
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-white mb-1 leading-tight">{event.title}</h3>
            <p className="text-sm text-gray-400">{event.clients?.name || 'Cliente sem nome'}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div className="text-sm">
              <p className="text-gray-500 text-xs">Horário</p>
              <p className="font-semibold">{formattedTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="w-4 h-4 text-amber-400" />
            <div className="text-sm">
              <p className="text-gray-500 text-xs">Local</p>
              <p className="font-semibold truncate">{event.location || 'Sem local'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <User className="w-4 h-4 text-violet-400" />
            <div className="text-sm">
              <p className="text-gray-500 text-xs">Status</p>
              <p className="font-semibold capitalize">
                {event.status === 'confirmed' ? '✓ Confirmado' : '◷ Pendente'}
              </p>
            </div>
          </div>

          <div className="text-gray-300">
            <div className="text-sm">
              <p className="text-gray-500 text-xs">Cachê</p>
              <p className="font-semibold">
                {isVisible
                  ? formatCurrency(getEventCacheAmount(event))
                  : '•••••'}
              </p>
            </div>
          </div>
        </div>

        {isOnStage && (
          <ModoPalcoActions event={event} accentColor={config.primaryHex} />
        )}

        {/* Countdown */}
        {countdown && !isOnStage && (
          <motion.div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 mb-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">ACONTECE EM</p>
              <div className="flex justify-center gap-4">
                {countdown.days > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-black text-cyan-400">{countdown.days}</div>
                    <div className="text-xs text-gray-500">dia{countdown.days !== 1 ? 's' : ''}</div>
                  </div>
                )}
                {(countdown.days > 0 || countdown.hours > 0) && (
                  <>
                    <div className="text-gray-600">:</div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-cyan-400">
                        {String(countdown.hours).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-500">horas</div>
                    </div>
                  </>
                )}
                {countdown.minutes >= 0 && (
                  <>
                    <div className="text-gray-600">:</div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-cyan-400">
                        {String(countdown.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-500">min</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Data */}
        <p className="text-sm text-gray-400 mb-6">{formattedDate.toUpperCase()}</p>

        {/* Descrição */}
        {event.description && (
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700/30">
            <p className="text-sm text-gray-300">{event.description}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewEvent ? onViewEvent(event) : hardNavigate('/calendar')}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-2"
          >
            <span>Ver Detalhes</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          {event.location && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(event.location)}`, '_blank')}
              className="px-4 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all flex items-center gap-2"
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
