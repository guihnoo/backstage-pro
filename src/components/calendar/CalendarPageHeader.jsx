import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarPageHeader({
  currentDate,
  unsyncedCount = 0,
  onPreviousMonth,
  onNextMonth,
  onSyncNow,
  viewMode = 'grid',
  onViewModeChange,
  monthStats = { showCount: 0, received: 0, pending: 0 },
  formatCurrency,
  isVisible = true,
}) {
  const monthName = format(currentDate, 'MMMM', { locale: ptBR }).toUpperCase();

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top row: Agenda title + Month navigator on left, View Switcher on right */}
      <div className="flex justify-between items-end">
        <div>
          <div className="font-mono text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">
            AGENDA
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              type="button"
              onClick={onPreviousMonth}
              aria-label="Mês anterior"
              className="w-8 h-10 border-0 bg-transparent text-[#a8a8a8] hover:text-white p-0 flex items-center justify-center transition-colors active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
            </button>
            <h1 className="font-display text-[32px] sm:text-[36px] text-white leading-none tracking-wide">
              {monthName}
            </h1>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Próximo mês"
              className="w-8 h-10 border-0 bg-transparent text-[#a8a8a8] hover:text-white p-0 flex items-center justify-center transition-colors active:scale-95"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.4]" />
            </button>
          </div>
        </div>

        {/* View toggle (Mês / Lista) pill container */}
        <div
          role="group"
          aria-label="Visualização"
          className="flex bg-[#161616] border border-[#262626] rounded-2xl p-0.5 mb-1 shadow-sm"
        >
          <button
            type="button"
            aria-pressed={viewMode === 'grid'}
            onClick={() => onViewModeChange?.('grid')}
            className={`h-7 sm:h-8 px-3 rounded-xl border-0 font-sans text-xs font-extrabold transition-all ${
              viewMode === 'grid'
                ? 'bg-[#ffd400] text-[#0a0a0a] shadow-sm'
                : 'bg-transparent text-[#a8a8a8] hover:text-white'
            }`}
          >
            Mês
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'list'}
            onClick={() => onViewModeChange?.('list')}
            className={`h-7 sm:h-8 px-3 rounded-xl border-0 font-sans text-xs font-extrabold transition-all ${
              viewMode === 'list'
                ? 'bg-[#ffd400] text-[#0a0a0a] shadow-sm'
                : 'bg-transparent text-[#a8a8a8] hover:text-white'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Sync badge if unsynced */}
      {unsyncedCount > 0 && (
        <button
          type="button"
          onClick={onSyncNow}
          className="self-start flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#ff2e88]/40 bg-[#ff2e88]/10 text-[#ff2e88] hover:bg-[#ff2e88]/20 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          {unsyncedCount} fora de sinc com Google Calendar
        </button>
      )}

      {/* 3 Top KPIs Strip matching Board C */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-[10px] bg-[#161616] border border-[#222222] p-2 flex flex-col justify-center">
          <div className="font-display text-[20px] text-[#ffd400] leading-none">
            {monthStats.showCount || 0}
          </div>
          <div className="font-mono text-[10px] text-[#a8a8a8] uppercase mt-0.5 truncate">
            DIÁRIAS
          </div>
        </div>

        <div className="rounded-[10px] bg-[#161616] border border-[#222222] p-2 flex flex-col justify-center">
          <div className="font-display text-[20px] text-white leading-none truncate">
            {isVisible ? (monthStats.received > 0 ? formatCurrency(monthStats.received) : 'R$ 0') : '•••••'}
          </div>
          <div className="font-mono text-[10px] text-[#a8a8a8] uppercase mt-0.5 truncate">
            NO MÊS
          </div>
        </div>

        <div className="rounded-[10px] bg-[#161616] border border-[#222222] p-2 flex flex-col justify-center">
          <div className="font-display text-[20px] text-[#ff2e88] leading-none truncate">
            {isVisible ? (monthStats.pending > 0 ? formatCurrency(monthStats.pending) : 'R$ 0') : '•••••'}
          </div>
          <div className="font-mono text-[10px] text-[#a8a8a8] uppercase mt-0.5 truncate">
            A RECEBER
          </div>
        </div>
      </div>
    </div>
  );
}
