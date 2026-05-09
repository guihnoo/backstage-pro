import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventTemplate } from '@/api/entities';
import { User } from '@/api/entities';
import { Loader2, Sparkles, X } from 'lucide-react';

const EventTemplateModal = ({ isOpen, onClose, onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchTemplates = async () => {
        setLoading(true);
        try {
          const user = await User.me();
          const fetchedTemplates = await EventTemplate.filter({ created_by: user.email });
          setTemplates(fetchedTemplates || []);
        } catch (error) {
          console.error("Erro ao buscar templates:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchTemplates();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="w-5 h-5" />
                Usar Template de Evento
              </DialogTitle>
              <DialogDescription>
                Selecione um template para preencher os dados do evento rapidamente.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2 -mr-2">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                </div>
              ) : templates.length > 0 ? (
                templates.map(template => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-cyan-400/50 transition-colors"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white">{template.name}</p>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: template.color }}></div>
                    </div>
                    <p className="text-sm text-slate-400">{template.title}</p>
                    <p className="text-sm text-green-400 font-mono mt-1">R$ {template.daily_cache_value.toFixed(2)}</p>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-400">Nenhum template encontrado.</p>
                  <p className="text-xs text-slate-500 mt-1">Você pode criar templates no futuro.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default EventTemplateModal;