import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Feedback } from '@/api/entities';
import { APP_VERSION } from '@/lib/appVersion';

export const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug', emoji: '🐛' },
  { id: 'suggestion', label: 'Sugestão', emoji: '💡' },
  { id: 'question', label: 'Dúvida', emoji: '❓' },
  { id: 'praise', label: 'Elogio', emoji: '⭐' },
];

export const FEEDBACK_STATUS = {
  new: { label: 'Novo', color: '#A64AFF' },
  in_review: { label: 'Em análise', color: '#eab308' },
  resolved: { label: 'Resolvido', color: '#39FF14' },
};

export async function submitFeedback({
  userId,
  userEmail,
  type,
  message,
  rating,
  pagePath,
  screenshotUrl,
}) {
  const trimmed = message?.trim();
  if (!trimmed) throw new Error('Escreva sua mensagem.');

  return Feedback.create({
    user_id: userId,
    user_email: userEmail || null,
    type: type || 'suggestion',
    message: trimmed,
    rating: rating && rating >= 1 && rating <= 5 ? rating : null,
    page_path: pagePath || null,
    app_version: APP_VERSION,
    screenshot_url: screenshotUrl || null,
    status: 'new',
  });
}

export function useOwnerFeedbacks(enabled) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (qErr) throw qErr;
      setItems(data || []);
    } catch (err) {
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const newCount = items.filter((f) => f.status === 'new').length;

  const updateFeedback = useCallback(async (id, patch) => {
    const updated = await Feedback.update(id, {
      ...patch,
      updated_at: new Date().toISOString(),
    });
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, ...updated } : f)));
    return updated;
  }, []);

  return { items, loading, error, refetch, newCount, updateFeedback };
}
