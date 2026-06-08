import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Save } from 'lucide-react';

export default function NotesSheet({ 
  event,
  client,
  isOpen, 
  onClose,
  onSave
}) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (event) {
      setNotes(event.observacoes_md || '');
    }
  }, [event]);

  const handleSave = () => {
    onSave({ observacoes_md: notes });
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const sheetVariants = {
    hidden: { 
      opacity: 0, 
      y: '100%',
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 500
      }
    },
    exit: { 
      opacity: 0, 
      y: '100%',
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full sm:w-auto sm:min-w-[420px] sm:max-w-[500px] bg-slate-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-2 sm:hidden flex-shrink-0">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </div>

            {/* Header - Fixed */}
            <div className="flex items-center justify-between px-4 py-3 sm:p-6 border-b border-slate-800 flex-shrink-0 bg-slate-900">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">
                    Observações
                  </h3>
                  <p className="text-sm text-slate-400 truncate">{event?.title}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-white flex-shrink-0 h-9 w-9"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-5 pb-safe">
                {/* Informações do Evento */}
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h4 className="font-medium text-white mb-1 truncate text-sm">{event?.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{client?.name}</p>
                </div>

                {/* Campo de Observações */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">
                    Anotações do Evento (Suporta Markdown)
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Digite suas observações sobre o evento aqui...&#10;&#10;Você pode usar Markdown:&#10;- **negrito**&#10;- *itálico*&#10;- # Títulos&#10;- Links, listas, etc."
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 min-h-[280px] resize-none text-base"
                  />
                  <p className="text-xs text-slate-500">
                    {notes.length} caracteres
                  </p>
                </div>

                {/* Dica de Markdown */}
                <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-xs text-blue-300">
                    💡 <strong>Dica:</strong> Use Markdown para formatar suas anotações. Isso será renderizado quando você visualizar os detalhes do evento.
                  </p>
                </div>
              </div>
            </ScrollArea>

            {/* Footer - Fixed */}
            <div className="flex gap-3 p-4 sm:p-6 border-t border-slate-800 flex-shrink-0 bg-slate-900 pb-safe">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-slate-800 border-slate-700 h-12 text-base"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 h-12 text-base font-semibold"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}