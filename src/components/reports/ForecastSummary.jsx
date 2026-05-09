import React, { useState, useEffect } from 'react';
import { Event, User } from '@/api/entities';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

export default function ForecastSummary() {
  const { isVisible, formatCurrency } = useFinancialVisibility();
  const [forecast, setForecast] = useState({ revenue: 0, events: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      setIsLoading(true);
      
      // CRÍTICO: Primeiro obter o usuário atual
      const currentUser = await User.me();
      if (!currentUser || !currentUser.email) {
        console.error('Usuário não autenticado');
        setForecast({ revenue: 0, events: 0 });
        return;
      }

      const nextMonthStart = startOfMonth(addMonths(new Date(), 1));
      const nextMonthEnd = endOfMonth(addMonths(new Date(), 1));
      
      // CRÍTICO: Filtrar APENAS eventos do usuário atual
      const userEvents = await Event.filter({
        created_by: currentUser.email,
        start_date: { '>=': nextMonthStart.toISOString().split('T')[0] }
      });
      
      // SEGURANÇA: Dupla verificação de que todos os eventos pertencem ao usuário
      const nextMonthEvents = userEvents.filter(event => {
        // Verificar novamente se pertence ao usuário
        if (event.created_by !== currentUser.email) {
          console.warn('Tentativa de acesso a dados de outro usuário bloqueada:', event.id);
          return false;
        }
        
        const startDate = new Date(event.start_date);
        return startDate <= nextMonthEnd;
      });

      const totalRevenue = nextMonthEvents.reduce((sum, event) => {
        const days = (new Date(event.end_date) - new Date(event.start_date)) / (1000 * 60 * 60 * 24) + 1;
        return sum + (days * (event.daily_cache_value || 0));
      }, 0);

      setForecast({ revenue: totalRevenue, events: nextMonthEvents.length });
    } catch (error) {
      console.error('Erro ao buscar previsões:', error);
      setForecast({ revenue: 0, events: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Carregando previsão...
        </h3>
        <div className="animate-pulse bg-slate-700 h-4 rounded mb-2"></div>
        <div className="animate-pulse bg-slate-700 h-4 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Previsão para {format(addMonths(new Date(), 1), 'MMMM')}
      </h3>
      <div className="flex justify-between items-center text-slate-300">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{isVisible ? formatCurrency(forecast.revenue) : '•••••'}</p>
          <p className="text-xs">Receita Prevista</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white">{forecast.events}</p>
          <p className="text-xs">Eventos Agendados</p>
        </div>
      </div>
    </div>
  );
}