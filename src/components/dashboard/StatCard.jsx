import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, icon: Icon, color, trend, onClick }) {
  return (
    <Card 
      className={`bg-slate-900/50 border-slate-800 transition-all duration-300 hover:border-slate-700 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs sm:text-sm font-medium text-slate-400 mb-2 truncate">
              {title}
            </p>
            <p 
              className={`text-lg sm:text-xl md:text-2xl font-bold ${color} leading-tight`}
              style={{ 
                wordBreak: 'break-word', 
                overflowWrap: 'break-word',
                hyphens: 'auto'
              }}
            >
              {value}
            </p>
          </div>
          {Icon && (
            <div className="flex-shrink-0">
              <Icon className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ${color} opacity-50`} />
            </div>
          )}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs sm:text-sm mt-3 ${
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend === 'up' && <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
            <span className="truncate">{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}