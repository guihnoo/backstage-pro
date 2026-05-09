import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Star, X } from 'lucide-react';
import { Feedback } from '@/api/entities';
import { User } from '@/api/entities';
import { toast } from 'sonner';

export default function FeedbackModal({ isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Erro ao buscar usuário para feedback:", error);
      }
    }
    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      toast.error('Feedback muito curto', {
        description: 'Por favor, descreva sua experiência com mais detalhes (mínimo 10 caracteres).',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await Feedback.create({
        user_email: user?.email || 'anonimo@backstage.pro',
        rating,
        message,
      });
      toast.success('Feedback enviado com sucesso!', {
        description: 'Obrigado por nos ajudar a melhorar o Backstage Pro.',
      });
      setMessage('');
      setRating(0);
      onClose(); // Fecha o modal após o envio
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
      toast.error('Erro ao enviar feedback', {
        description: 'Por favor, tente novamente mais tarde.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-lg border-slate-800 text-slate-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Enviar Feedback</DialogTitle>
          <DialogDescription>
            Sua opinião é muito importante para nós.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Como você avalia sua experiência?
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-all ${
                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-amber-300'
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="feedback-message" className="text-sm font-medium text-slate-300 mb-2 block">
              Sua mensagem
            </label>
            <Textarea
              id="feedback-message"
              placeholder="Conte-nos sobre sua experiência, sugestões de melhoria ou reportar bugs..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              className="h-32 bg-slate-800 border-slate-700 resize-none"
            />
            <p className="text-xs text-slate-500 text-right mt-1">
              {message.length} / 1000
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="bg-slate-700 hover:bg-slate-600">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !message.trim()}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}