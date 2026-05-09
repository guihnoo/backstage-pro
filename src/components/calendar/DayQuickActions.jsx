import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";

const DayQuickActions = ({
  open,
  target,
  onOpenChange,
  onNewEvent,
  onNewWork,
}) => {
  // Não renderiza nada se não houver um alvo para ancorar o popover
  if (!target) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor asChild>
            {/* Elemento invisível para ancorar o Popover no centro do dia clicado */}
            <div
                style={{
                    position: 'absolute',
                    top: target.offsetTop + target.offsetHeight / 2,
                    left: target.offsetLeft + target.offsetWidth / 2,
                    transform: 'translate(-50%, -50%)',
                }}
            />
        </PopoverAnchor>
      <PopoverContent
        side="top"
        align="center"
        className="w-auto bg-slate-900/90 backdrop-blur-sm border-slate-700 p-2 shadow-2xl"
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
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
            onClick={onNewEvent}
          >
            <Plus className="w-4 h-4 mr-2" />
            Evento
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
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