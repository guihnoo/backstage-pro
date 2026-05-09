import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarPlus, DollarSign, Plus, Timer, Zap, Calendar } from 'lucide-react';
import EventCardLarge from './EventCardLarge';
import { getEventsForDate, getWorkForDate } from '../utils/dateUtils';
import { Badge } from '@/components/ui/badge';

const THEME = {
  surfaceAlt: "#0F172A",
  border: "#1E293B",
  text: "#E6EEF8",
  accent: "#22D3EE",
};

const FinancialSummaryChips = ({ work }) => {
  if (!work) return null;
  const hasWork = work.total_hours > 0 || work.overtime_hours > 0 || work.daily_cache > 0;
  if (!hasWork) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700/50">
      {work.total_hours > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded-md">
          <Timer className="w-3 h-3 text-cyan-400 flex-shrink-0"/>
          <span className="font-medium">{(work.total_hours || 0).toFixed(1)}h</span>
        </div>
      )}
      {work.overtime_hours > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md">
          <Zap className="w-3 h-3 text-amber-400 flex-shrink-0"/>
          <span className="font-medium">+{(work.overtime_hours || 0).toFixed(1)}h</span>
        </div>
      )}
      {work.daily_cache > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-green-300 bg-green-500/10 px-2 py-1 rounded-md">
          <DollarSign className="w-3 h-3 text-green-400 flex-shrink-0"/>
          <span className="font-medium">R$ {(work.daily_cache || 0).toFixed(0)}</span>
        </div>
      )}
    </div>
  );
};

const DayDetailPanel = ({ day, allEvents, allWork, allClients, onEventClick, onActionClick }) => {
  const dayEvents = getEventsForDate(allEvents, day);
  const dayWork = getWorkForDate(allWork, day);
  const today = isToday(day);

  const totalHours = dayWork ? dayWork.total_hours || 0 : 0;
  const totalCache = dayWork ? dayWork.daily_cache || 0 : 0;
  const overtimeHours = dayWork ? dayWork.overtime_hours || 0 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-[60vh] rounded-2xl shadow-xl overflow-hidden"
      style={{
        backgroundColor: THEME.surfaceAlt,
        border: `1px solid ${THEME.border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header - Melhorado para mobile */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-800 rounded-xl">
                <span className="text-2xl font-bold text-white font-display">
                  {format(day, 'dd', { locale: ptBR })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white font-display leading-tight">
                  {format(day, 'EEEE', { locale: ptBR })}
                </h2>
                <p className="text-sm text-slate-400 leading-tight">
                  {format(day, 'dd \'de\' MMMM', { locale: ptBR })}
                </p>
              </div>
            </div>
            {today && (
              <Badge className="bg-cyan-400/20 text-cyan-300 border-cyan-400/30 text-xs px-2 py-1 whitespace-nowrap">
                Hoje
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions - Redesenhado para mobile */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onActionClick('event', day)}
            className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white flex flex-col items-center justify-center h-16 p-2"
          >
            <CalendarPlus className="w-4 h-4 mb-1 flex-shrink-0" />
            <span className="text-xs font-medium leading-tight">Evento</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onActionClick('work', day)}
            className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white flex flex-col items-center justify-center h-16 p-2"
          >
            <Timer className="w-4 h-4 mb-1 flex-shrink-0" />
            <span className="text-xs font-medium leading-tight">Horas</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onActionClick('expense', day)}
            className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white flex flex-col items-center justify-center h-16 p-2"
          >
            <DollarSign className="w-4 h-4 mb-1 flex-shrink-0" />
            <span className="text-xs font-medium leading-tight">Despesa</span>
          </Button>
        </div>

        {/* Events Section - Melhorado para mobile */}
        <div className="flex-1 min-h-0">
          {dayEvents.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                Eventos ({dayEvents.length})
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-64">
                {dayEvents.map(event => {
                  const client = allClients.find(c => c.id === event.client_id);
                  return (
                    <EventCardLarge
                      key={event.id}
                      event={event}
                      client={client}
                      onClick={onEventClick}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mb-3 flex-shrink-0" />
              <p className="text-slate-400 text-sm leading-relaxed px-4">
                Nenhum evento para este dia
              </p>
            </div>
          )}
        </div>

        {/* Financial Summary - Sempre na parte inferior */}
        <div className="mt-auto">
          <FinancialSummaryChips work={dayWork} />
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(DayDetailPanel);