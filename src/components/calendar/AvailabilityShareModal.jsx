import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageCircle, Copy, CheckCircle2 } from 'lucide-react';
import { format, addMonths, subMonths, getDaysInMonth, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buildAvailabilityMessage } from '@/lib/whatsapp';
import { useAuth } from '@/lib/authContext';
import { getEventStatus } from '@/components/utils/dateUtils';
import appToast from '@/lib/appToast';

export default function AvailabilityShareModal({ open, onClose, events = [], clients = [] }) {
  const { profile } = useAuth();
  const [viewDate, setViewDate] = useState(new Date());
  const [copied, setCopied] = useState(false);

  const clientMap = useMemo(
    () => new Map((clients || []).map(c => [c.id, c])),
    [clients]
  );

  const { freeDays, bookedShows, monthLabel } = useMemo(() => {
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0-indexed
    const totalDays = getDaysInMonth(viewDate);
    const label = format(viewDate, "MMMM 'de' yyyy", { locale: ptBR });
    const capLabel = label.charAt(0).toUpperCase() + label.slice(1);

    // Collect booked days from non-cancelled events
    const bookedMap = {}; // day -> [title]
    events.forEach(ev => {
      if (!ev.start_date) return;
      const st = getEventStatus(ev);
      if (st === 'cancelled') return;
      const d = parseISO(ev.start_date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const day = d.getDate();
      if (!bookedMap[day]) bookedMap[day] = [];
      const clientName = clientMap.get(ev.client_id)?.name;
      const label = ev.title || (clientName ? `Show — ${clientName}` : 'Evento');
      bookedMap[day].push(label);
    });

    const bookedDays = new Set(Object.keys(bookedMap).map(Number));
    const today = startOfDay(new Date());
    const isPastMonth = new Date(year, month + 1, 0) < today;

    // Free days: not booked, not in the past (unless past month, show all)
    const free = [];
    for (let d = 1; d <= totalDays; d++) {
      if (bookedDays.has(d)) continue;
      if (!isPastMonth) {
        const dayDate = new Date(year, month, d);
        if (dayDate < today) continue; // skip past days in current/future month
      }
      free.push(d);
    }

    const booked = Object.entries(bookedMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([day, titles]) => ({ day: Number(day), title: titles[0] }));

    return { freeDays: free, bookedShows: booked, monthLabel: capLabel };
  }, [viewDate, events, clientMap]);

  const message = useMemo(() => buildAvailabilityMessage({
    monthLabel,
    freeDays,
    bookedShows,
    techName: profile?.name || '',
  }), [monthLabel, freeDays, bookedShows, profile]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      appToast.success('Copiado!', { description: 'Cole no WhatsApp ou onde preferir.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      appToast.error('Erro ao copiar');
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white p-0 flex flex-col overflow-hidden max-h-[90dvh] bp-focus-scope">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-slate-800 flex-shrink-0">
          <DialogTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-400" />
            Compartilhar Disponibilidade
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Month picker */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(d => subMonths(d, 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-semibold text-white">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setViewDate(d => addMonths(d, 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Summary pills */}
          <div className="flex gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              {freeDays.length} livre{freeDays.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-400">
              {bookedShows.length} agendado{bookedShows.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Prévia da mensagem</p>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {message}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-3 border-t border-slate-800 flex gap-2 flex-shrink-0">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 gap-2"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <Button
            onClick={handleWhatsApp}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
