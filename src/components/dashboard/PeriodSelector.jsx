import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

const periods = [
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_month', label: 'Mês Anterior' },
  { value: 'next_month', label: 'Próximo Mês' },
  { value: 'this_year', label: 'Este Ano' },
];

export default function PeriodSelector({ selectedPeriod, onPeriodChange }) {
  return (
    <div className="w-full sm:w-auto">
      <Select value={selectedPeriod} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-full sm:w-[200px] bg-slate-800 border-slate-700 text-white focus:ring-cyan-400 focus:border-cyan-400 h-11 sm:h-12 text-base">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700 text-white">
          {periods.map((period) => (
            <SelectItem 
              key={period.value} 
              value={period.value}
              className="text-white hover:bg-slate-800 focus:bg-slate-800 cursor-pointer py-3 text-base"
            >
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}