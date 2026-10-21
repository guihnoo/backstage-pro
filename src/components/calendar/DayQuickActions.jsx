import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const toIsoDate = (d) => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DayQuickActions = ({
  open,
  date,
  target,
  onOpenChange,
  onNewEvent,
  onNewWork,
}) => {
  const { primaryHex } = useCategoryTheme();
  if (!open) return null;

  // Alvo explícito (clique) ou, como fallback, a célula da grade pelo data-date
  // (navegação por teclado / chamadas sem elemento DOM).
  const iso = toIsoDate(date);
  const anchorEl =
    (target && typeof target.getBoundingClientRect === 'function' ? target : null) ||
    (iso && typeof document !== 'undefined' ? document.querySelector(`[data-date="${iso}"]`) : null);
  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {createPortal(
        <PopoverAnchor asChild>
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: rect.top + rect.height / 2,
              left: rect.left + rect.width / 2,
              width: 1,
              height: 1,
              pointerEvents: 'none',
            }}
          />
        </PopoverAnchor>,
        document.body
      )}
      <PopoverContent
        side="top"
        align="center"
        className="w-auto bg-[#161616]/90 backdrop-blur-sm border-[#2a2a2a] p-2 shadow-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()} // Evita que o popover "roube" o foco
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          <Button
            size="sm"
            className="text-white font-semibold hover:opacity-90"
            style={{ backgroundColor: primaryHex }}
            onClick={onNewEvent}
          >
            <Plus className="w-4 h-4 mr-2" />
            Evento
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-[#1f1f1f] border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#e0e0e0]"
            onClick={onNewWork}
          >
            <Clock className="w-4 h-4 mr-2" />
            Horas
          </Button>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
};

export default DayQuickActions;