import { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import appToast from '@/lib/appToast';
import { getEventStatus } from '@/components/utils/dateUtils';

const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente'];

/**
 * Avaliacao do cliente (estrelas + observacao) — peca unica usada pelas janelas de detalhe do evento.
 * Antes so existia na janela dos Relatorios; agora aparece em qualquer tela (missao 5d404, etapa 2).
 */
export default function ClientRatingSection({ event, updateEvent }) {
  const [draft, setDraft] = useState(event?.client_rating ?? null);
  const [notes, setNotes] = useState(event?.client_rating_notes || '');
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(event?.client_rating ?? null);
    setNotes(event?.client_rating_notes || '');
  }, [event?.id, event?.client_rating, event?.client_rating_notes]);

  if (!event?.client_id || getEventStatus(event) !== 'completed') return null;

  const save = async (stars, text) => {
    if (!event?.id || typeof updateEvent !== 'function') return;
    setSaving(true);
    try {
      await updateEvent(event.id, { client_rating: stars, client_rating_notes: text || null });
      appToast.success('Avaliação salva');
    } catch {
      appToast.error('Erro ao salvar avaliação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-400" />
        Avaliação do cliente
      </h3>
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg px-4 py-3 space-y-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => { setDraft(star); save(star, notes); }}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5 transition-transform hover:scale-110"
              title={`${star} estrela${star > 1 ? 's' : ''}`}
              aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
            >
              <Star
                className="w-6 h-6 transition-colors"
                fill={(hover || draft || 0) >= star ? '#fbbf24' : 'none'}
                stroke={(hover || draft || 0) >= star ? '#fbbf24' : '#64748b'}
              />
            </button>
          ))}
          {draft ? <span className="ml-2 text-xs text-amber-400 font-medium">{LABELS[draft]}</span> : null}
          {saving && <Loader2 className="w-4 h-4 text-slate-500 animate-spin ml-2" />}
        </div>
        {draft ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => draft && save(draft, notes)}
            placeholder="Observação sobre o cliente (opcional)."
            rows={2}
            className="w-full bg-slate-700/50 border border-slate-600/60 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        ) : null}
      </div>
    </div>
  );
}
