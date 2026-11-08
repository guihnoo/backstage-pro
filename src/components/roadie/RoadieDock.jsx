import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, ChevronRight } from 'lucide-react';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useDailyWork } from '@/lib/useDailyWork';
import { useAppScrollLock } from '@/lib/useAppScrollLock';
import { todayLocalISO } from '@/components/utils/dateUtils';
import { buildRoadieCards, cardsForRoute, calculateEventReceivableAmount } from '@/lib/roadie/engine';
import { buildChargeMessage, openWhatsAppCharge } from '@/lib/whatsapp';
import appToast from '@/lib/appToast';
import RoadieAvatar from './RoadieAvatar';

const HIDDEN_KEY = 'bp_roadie_dispensados';
function loadHidden() {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '{}'); } catch { return {}; }
}

/**
 * Roadie em todas as telas (08/11): botão flutuante com o que ele achou sozinho.
 * "Preparar e eu aprovo": cada cartão abre a tela certa ou monta a mensagem — nada é gravado aqui.
 */
export default function RoadieDock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pergunta, setPergunta] = useState('');
  const [hidden, setHidden] = useState(loadHidden);
  const { events } = useEvents();
  const { clients } = useClients();
  const { dailyWork } = useDailyWork();
  useAppScrollLock(open);

  const today = todayLocalISO();
  const cards = useMemo(() => {
    const all = buildRoadieCards({ events, dailyWork, clients, today, now: new Date() });
    return cardsForRoute(all, pathname).filter((c) => hidden[c.id] !== today);
  }, [events, dailyWork, clients, today, pathname, hidden]);
  const urgentes = cards.filter((c) => c.priority <= 2).length;

  if (pathname.startsWith('/roadie') || pathname.startsWith('/ai-mentor')) return null;

  const dispensar = (id) => {
    const next = { ...hidden, [id]: today };
    setHidden(next);
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(next)); } catch { /* sem storage */ }
  };

  const agir = (action) => {
    if (!action) return;
    if (action.type === 'navigate') {
      setOpen(false);
      navigate(action.to);
      return;
    }
    if (action.type === 'cobrar') {
      const ev = (events || []).find((e) => e.id === action.eventId);
      const client = (clients || []).find((c) => c.id === action.clientId);
      if (!ev) return;
      const work = (dailyWork || []).filter((w) => w.event_id === ev.id);
      const amount = calculateEventReceivableAmount(ev, work);
      const msg = buildChargeMessage({ clientName: client?.contact_person || client?.name, events: [{ ...ev, amount }], totalAmount: amount });
      if (!openWhatsAppCharge(client?.phone, msg)) {
        appToast.info('Cliente sem WhatsApp cadastrado', { description: 'Abra o cliente e adicione o telefone.' });
      }
    }
  };

  const perguntar = (e) => {
    e?.preventDefault();
    const q = pergunta.trim();
    setOpen(false);
    setPergunta('');
    navigate(q ? `/roadie?q=${encodeURIComponent(q)}` : '/roadie');
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={urgentes ? `Roadie: ${urgentes} coisa${urgentes > 1 ? 's' : ''} para ver` : 'Abrir o Roadie'}
        data-testid="roadie-dock"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.92 }}
        className="fixed right-4 z-[38] w-14 h-14 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        style={{ bottom: 'calc(6.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <RoadieAvatar size={56} />
        {urgentes > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-[#ff2e88] text-white text-[12px] font-extrabold flex items-center justify-center border-2 border-[#0a0a0a]">
            {urgentes}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[90] bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.section
              role="dialog"
              aria-label="Roadie"
              data-testid="roadie-sheet"
              className="fixed left-0 right-0 bottom-0 z-[95] max-h-[85dvh] flex flex-col rounded-t-[24px] bg-[#0f0f0f] border-t-2 border-[#ffd400]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => { if (info.offset.y > 100) setOpen(false); }}
            >
              <div className="mx-auto mt-2 w-10 h-1.5 rounded-full bg-[#333]" />
              <header className="flex items-center gap-3 px-4 pt-3 pb-2">
                <RoadieAvatar size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-poster text-[26px] leading-none uppercase">Roadie</p>
                  <p className="text-[12px] text-[#a8a8a8]">
                    {cards.length ? 'Deixei isso pronto para você:' : 'Tudo em ordem nos bastidores.'}
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Fechar o Roadie" className="w-11 h-11 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2.5 bp-modal-scroll">
                <AnimatePresence initial={false}>
                  {cards.map((c) => (
                    <motion.article
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 80 }}
                      className={`rounded-2xl border p-3.5 ${c.priority === 1 ? 'border-[#ff2e88]/60 bg-[#ff2e88]/10' : 'border-[#222] bg-[#161616]'}`}
                      data-testid="roadie-card"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[15px] leading-snug">{c.title}</p>
                          <p className="text-[13px] text-[#c8c8c8] mt-0.5">{c.body}</p>
                        </div>
                        <button type="button" onClick={() => dispensar(c.id)} aria-label="Dispensar hoje" className="w-9 h-9 -mr-1 -mt-1 rounded-full text-[#777] flex items-center justify-center shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button type="button" onClick={() => agir(c.action)} className="flex-1 min-h-[44px] rounded-full bg-[#ffd400] text-[#0a0a0a] font-extrabold text-[14px] flex items-center justify-center gap-1">
                          {c.action.label} <ChevronRight className="w-4 h-4" />
                        </button>
                        {c.secondary && (
                          <button type="button" onClick={() => agir(c.secondary)} className="min-h-[44px] px-4 rounded-full border border-[#333] text-white font-extrabold text-[14px]">
                            {c.secondary.label}
                          </button>
                        )}
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>

              <form onSubmit={perguntar} className="px-4 pt-2 border-t border-[#1f1f1f]" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
                <div className="flex gap-2">
                  <input
                    value={pergunta}
                    onChange={(e) => setPergunta(e.target.value)}
                    placeholder="Pergunte: quem me deve? quanto ganhei em outubro?"
                    aria-label="Perguntar ao Roadie"
                    className="flex-1 min-w-0 h-12 rounded-full bg-[#161616] border border-[#2a2a2a] px-4 text-[14px] text-white placeholder:text-[#777]"
                  />
                  <button type="submit" aria-label="Enviar pergunta ao Roadie" className="w-12 h-12 rounded-full bg-[#ffd400] text-[#0a0a0a] flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
