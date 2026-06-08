import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Building2, Timer, Zap, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

export default function EventCardLarge({ event, client, work, onView, onEdit, className = "" }) {
  const { formatCurrency } = useFinancialVisibility();

  if (!event) return null;

  const hasWork = work && (work.total_hours > 0 || work.daily_cache > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 hover:border-cyan-400/30 transition-all duration-300 ${className}`}
    >
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Logo/Ícone do Cliente */}
          <div className="flex-shrink-0">
            {client?.logo_url ? (
              <div className="w-12 h-12 rounded-lg bg-white/10 p-2 border border-slate-600">
                <img 
                  src={client.logo_url} 
                  alt={`Logo ${client.name}`}
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                <Building2 className="w-full h-full text-slate-400" />
              </div>
            )}
          </div>

          {/* Informações do Cliente/Evento */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-cyan-300 font-display tracking-wide leading-tight mb-1">
              {client?.name || 'Cliente'}
            </h3>
            <p className="text-base text-white leading-tight mb-2 break-words">
              {event.title}
            </p>
            
            {/* Período do Evento */}
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="leading-tight">
                {format(new Date(event.start_date), 'dd/MM', { locale: ptBR })} - {format(new Date(event.end_date), 'dd/MM', { locale: ptBR })}
              </span>
              {event.start_time && (
                <>
                  <Clock className="w-4 h-4 flex-shrink-0 ml-2" />
                  <span className="leading-tight">{event.start_time}</span>
                </>
              )}
            </div>

            {/* Status/Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {event.status && (
                <Badge 
                  className={`text-xs px-2 py-1 ${
                    event.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                    event.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                    'bg-slate-500/20 text-slate-300 border-slate-400/30'
                  }`}
                >
                  {event.status === 'completed' ? 'Concluído' :
                   event.status === 'in_progress' ? 'Em andamento' : 'Agendado'}
                </Badge>
              )}
              <Badge 
                className={`text-xs px-2 py-1 ${
                  event.payment_status === 'paid' 
                    ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                {event.payment_status === 'paid' ? 'Pago' : 'Pendente'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Cor do Evento */}
        <div 
          className="w-4 h-12 rounded-full flex-shrink-0"
          style={{ backgroundColor: event.color || '#22d3ee' }}
        />
      </div>

      {/* Informações Financeiras */}
      <div className="bg-slate-900/50 rounded-xl p-3 mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-400 block">Cachê/dia:</span>
            <p className="font-bold text-base text-green-300 leading-tight">
              {formatCurrency(event.daily_cache_value || 0)}
            </p>
          </div>
          {hasWork && (
            <div>
              <span className="text-slate-400 block">Hoje:</span>
              <p className="font-bold text-base text-green-300 leading-tight">
                {formatCurrency(work.daily_cache || 0)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Informações de Trabalho */}
      {hasWork && (
        <div className="bg-slate-700/30 rounded-xl p-3 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-400 block">Horas:</span>
              <p className="font-bold text-base text-cyan-300 leading-tight">
                {(work.total_hours || 0).toFixed(1)}h
              </p>
            </div>
            <div>
              <span className="text-slate-400 block">Horário:</span>
              <p className="font-bold text-base text-white leading-tight font-mono">
                {work.entry_time || '--:--'} - {work.exit_time || '--:--'}
              </p>
            </div>
          </div>

          {/* Horas Extras */}
          {work.overtime_hours && work.overtime_hours > 0 && (
            <div className="mt-3 p-2 bg-pink-500/20 border border-pink-400/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <span className="text-pink-300 font-bold text-sm">
                  +{work.overtime_hours.toFixed(1)}h extras
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          onClick={() => onView(event)}
          className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 hover:text-white h-11 font-medium"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Detalhes
        </Button>
        <Button
          onClick={() => onEdit(event)}
          variant="outline"
          className="bg-transparent border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white h-11 px-4"
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}