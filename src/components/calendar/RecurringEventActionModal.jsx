import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight, CornerUpRight } from 'lucide-react';

export default function RecurringEventActionModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            Ação em Evento Recorrente
          </DialogTitle>
          <DialogDescription className="text-slate-400 pt-2">
            Esta ação afetará um evento que faz parte de uma série. Como você deseja proceder?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            className="w-full justify-start text-base py-6"
            onClick={() => onConfirm('single')}
          >
            <ArrowRight className="w-4 h-4 mr-3 text-cyan-400" />
            Alterar apenas este evento
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-base py-6"
            onClick={() => onConfirm('future')}
          >
            <CornerUpRight className="w-4 h-4 mr-3 text-amber-400" />
            Alterar este e os futuros eventos
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}