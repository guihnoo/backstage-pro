import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EventsList({ events, selectedMonth, isLoading }) {
  const getMonthlyEvents = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    return events.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      
      return (eventStart <= monthEnd && eventEnd >= monthStart);
    });
  };

  const monthlyEvents = getMonthlyEvents();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          Eventos do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))
          ) : monthlyEvents.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              Nenhum evento neste mês
            </p>
          ) : (
            monthlyEvents.map(event => (
              <div key={event.id} className="border-l-4 pl-4 py-2" style={{ borderColor: event.color }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{event.client}</h3>
                    {event.title && (
                      <p className="text-sm text-slate-600 mt-1">{event.title}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(event.start_date), 'dd/MM', { locale: ptBR })} - 
                      {format(new Date(event.end_date), 'dd/MM', { locale: ptBR })}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <DollarSign className="w-3 h-3 mr-1" />
                    R$ {event.cache_value.toFixed(2)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}