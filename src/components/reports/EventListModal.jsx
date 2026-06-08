
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { useFinancialVisibility } from '../context/FinancialVisibilityContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  List
} from 'lucide-react';
import EmptyState from '@/components/layout/EmptyState';

export default function EventListModal({ isOpen, onClose, title, events = [], onEventClick }) {
    const { formatCurrency } = useFinancialVisibility();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl h-[90vh] bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200 flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b border-slate-800">
                    <DialogTitle className="text-lg sm:text-xl font-bold text-white font-display">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-slate-300">
                        Lista detalhada de eventos correspondentes.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-6 pt-2 space-y-3">
                            {events.length > 0 ? (
                                events.map((event, index) => (
                                    <div key={event.id} onClick={() => onEventClick && onEventClick(event)} className="cursor-pointer">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center justify-between p-3 rounded-lg transition-colors border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                                        >
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div 
                                                    className="w-2 h-10 rounded-full flex-shrink-0" 
                                                    style={{ backgroundColor: event.color || '#22d3ee' }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-slate-200 truncate text-sm">
                                                        {event.client_name}
                                                    </p>
                                                    <p className="text-xs text-slate-300 truncate">{event.title || 'Sem título'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4 flex-shrink-0">
                                                <p className="font-bold text-green-300 text-sm">
                                                    {formatCurrency(event.calculated_value)}
                                                </p>
                                                <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{format(parseISO(event.start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={List}
                                    title="Nenhum evento encontrado"
                                    description="Não há eventos que correspondam a esta categoria."
                                    className="py-12"
                                />
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
