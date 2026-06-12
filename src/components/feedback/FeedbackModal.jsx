import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ImagePlus, Star } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/authContext';
import { useAppScrollLock } from '@/lib/useAppScrollLock';
import { uploadUserFile } from '@/lib/uploadFile';
import { submitFeedback, FEEDBACK_TYPES } from '@/lib/useFeedback';
import appToast from '@/lib/appToast';

export default function FeedbackModal({ open, onClose, primaryHex = '#22d3ee' }) {
  const { user } = useAuth();
  const location = useLocation();
  const fileRef = useRef(null);

  const [type, setType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [sending, setSending] = useState(false);

  useAppScrollLock(open);

  const reset = () => {
    setType('suggestion');
    setMessage('');
    setRating(0);
    setScreenshotPreview(null);
    setScreenshotFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    if (sending) return;
    reset();
    onClose();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      appToast.error('Faça login para enviar feedback.');
      return;
    }
    if (!message.trim()) {
      appToast.error('Escreva sua mensagem.');
      return;
    }

    setSending(true);
    try {
      let screenshotUrl = null;
      if (screenshotFile) {
        const { file_url } = await uploadUserFile(screenshotFile, { folder: 'feedback' });
        screenshotUrl = file_url;
      }

      await submitFeedback({
        userId: user.id,
        userEmail: user.email,
        type,
        message,
        rating: rating || null,
        pagePath: location.pathname,
        screenshotUrl,
      });

      appToast.success('Feedback enviado!', {
        description: 'Obrigado — sua mensagem chegou à equipe.',
      });
      reset();
      onClose();
    } catch (err) {
      appToast.error('Não foi possível enviar', { description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-slate-700/60 bg-[#0d0f1a] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 flex-shrink-0">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white">Feedback & Suporte</h2>
                <p className="text-xs text-slate-500 truncate">Conte bugs, ideias ou dúvidas sobre o app</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={sending}
                className="p-2 text-slate-500 hover:text-white rounded-lg shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bp-modal-scroll flex-1 min-h-0 px-5 py-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tipo</p>
                <div className="grid grid-cols-2 gap-2">
                  {FEEDBACK_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all min-w-0"
                      style={
                        type === t.id
                          ? {
                              background: `${primaryHex}18`,
                              borderColor: `${primaryHex}50`,
                              color: primaryHex,
                            }
                          : {
                              background: 'rgba(255,255,255,0.03)',
                              borderColor: 'rgba(255,255,255,0.08)',
                              color: '#9ca3af',
                            }
                      }
                    >
                      <span>{t.emoji}</span>
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Avaliação <span className="text-slate-600 normal-case">(opcional)</span>
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(rating === n ? 0 : n)}
                      className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                      aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                    >
                      <Star
                        className="w-6 h-6"
                        style={{
                          color: n <= rating ? '#eab308' : '#4b5563',
                          fill: n <= rating ? '#eab308' : 'transparent',
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-2 block" htmlFor="feedback-message">
                  Mensagem
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Descreva o que aconteceu ou o que você gostaria de ver no app…"
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 resize-none"
                  maxLength={4000}
                />
                <p className="text-[10px] text-slate-600 mt-1 text-right">{message.length}/4000</p>
              </div>

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
                {screenshotPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700">
                    <img src={screenshotPreview} alt="Anexo" className="w-full max-h-40 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotPreview(null);
                        setScreenshotFile(null);
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-sm transition-colors"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Anexar screenshot (opcional)
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-600 font-mono">
                Página: {location.pathname} · enviado com sua conta
              </p>
            </div>

            <div className="px-5 py-4 border-t border-slate-800 flex-shrink-0 pb-safe">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={sending || !message.trim()}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: primaryHex, color: '#050609' }}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  'Enviar feedback'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
