import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, DollarSign, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  normalizeDateString
} from "../utils/dateUtils";
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';

// Otimização: Memoização do componente
const MonthlyStats = React.memo(function MonthlyStats({ _events, dailyWork, currentDate, isLoading }) {
  const { formatCurrency } = useFinancialVisibility();

  // Memoização do cálculo de estatísticas mensais
  const monthlyStats = useMemo(() => {
    const monthStart = normalizeDateString(startOfMonth(currentDate));
    const monthEnd = normalizeDateString(endOfMonth(currentDate));
    
    if (!Array.isArray(dailyWork)) {
      return { totalDays: 0, totalHours: 0, totalOvertime: 0, totalCache: 0 };
    }
    
    const monthlyWork = dailyWork.filter(work => {
      if (!work || !work.date) return false;
      try {
        const workDate = normalizeDateString(work.date);
        return workDate >= monthStart && workDate <= monthEnd;
      } catch (error) {
        console.warn('Erro ao processar data do trabalho:', work, error);
        return false;
      }
    });

    const totalDays = monthlyWork.length;
    const totalHours = monthlyWork.reduce((sum, work) => sum + (work.total_hours || 0), 0);
    const totalOvertime = monthlyWork.reduce((sum, work) => sum + (work.overtime_hours || 0), 0);
    const totalCache = monthlyWork.reduce((sum, work) => sum + (work.daily_cache || 0), 0);

    return { totalDays, totalHours, totalOvertime, totalCache };
  }, [dailyWork, currentDate]); // Dependências para recalcular as estatísticas

  // Componente StatCard otimizado
  const StatCard = React.memo(({ title, value, icon: Icon, color, isLoading, isCurrency = false }) => (
    <Card className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 shadow-lg shadow-black/20 text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 md:p-6">
        <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-slate-400 font-body leading-tight truncate">
          {title}
        </CardTitle>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${color} flex-shrink-0`} />
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        {isLoading ? (
          <Skeleton className="h-6 sm:h-8 md:h-10 w-16 sm:w-20 md:w-24 bg-slate-700" />
        ) : (
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold font-display leading-tight">
            {isCurrency ? formatCurrency(value) : value}
          </div>
        )}
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-body">
          {format(currentDate, 'MMM yyyy', { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  ));

  const { totalDays, totalHours, totalOvertime, totalCache } = monthlyStats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
      <StatCard
        title="Dias Trabalhados"
        value={totalDays}
        icon={CalendarDays}
        color="text-cyan-400"
        isLoading={isLoading}
      />
      <StatCard
        title="Horas Trabalhadas"
        value={`${totalHours.toFixed(1)}h`}
        icon={Clock}
        color="text-green-400"
        isLoading={isLoading}
      />
      <StatCard
        title="Horas Extras"
        value={`${totalOvertime.toFixed(1)}h`}
        icon={Timer}
        color="text-pink-400"
        isLoading={isLoading}
      />
      <StatCard
        title="Cachê Total"
        value={totalCache}
        icon={DollarSign}
        color="text-amber-400"
        isLoading={isLoading}
        isCurrency={true}
      />
    </div>
  );
});

export default MonthlyStats;