import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, Users, MapPin, ChevronRight } from 'lucide-react';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { hardNavigate } from '@/lib/hardNavigate';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppScrollLock } from '@/lib/useAppScrollLock';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import EventHeading from '@/components/events/EventHeading';

const STATUS_LABEL = {
  scheduled: { label: 'Agendado', cls: 'bg-blue-500/20 text-blue-300' },
  confirmed: { label: 'Confirmado', cls: 'bg-indigo-500/20 text-indigo-300' },
  in_progress: { label: 'Em andamento', cls: 'bg-yellow-500/20 text-yellow-300' },
  completed: { label: 'Concluído', cls: 'bg-green-500/20 text-green-300' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-500/20 text-red-400 line-through' },
};

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const theme = useCategoryTheme();
  const { events = [] } = useEvents();
  const { clients = [] } = useClients();

  useAppScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const clientById = useMemo(() => {
    const m = {};
    clients.forEach(c => { m[c.id] = c; });
    return m;
  }, [clients]);

  const { matchedEvents, matchedClients } = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return { matchedEvents: [], matchedClients: [] };

    const me = events
      .filter(ev => {
        const client = clientById[ev.client_id];
        return (
          normalize(ev.title).includes(q) ||
          normalize(ev.location).includes(q) ||
          normalize(ev.location_city).includes(q) ||
          normalize(client?.name).includes(q) ||
          normalize(client?.contact_person).includes(q)
        );
      })
      .sort((a, b) => (b.start_date || '') > (a.start_date || '') ? 1 : -1)
      .slice(0, 6);

    const mc = clients
      .filter(c =>
        normalize(c.name).includes(q) ||
        normalize(c.contact_person).includes(q) ||
        normalize(c.email).includes(q) ||
        normalize(c.phone).includes(q)
      )
      .slice(0, 4);

    return { matchedEvents: me, matchedClients: mc };
  }, [query, events, clients, clientById]);

  const hasResults = matchedEvents.length > 0 || matchedClients.length > 0;
  const hasQuery = query.trim().length >= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Busca global"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-[#0d0f18] border-b border-slate-800 px-4 pt-safe pb-3"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar eventos, clientes, locais…"
                aria-label="Termo de busca"
                className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-base outline-none"
                style={{ caretColor: theme.primaryHex }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-white transition-colors ml-1 flex-shrink-0"
              >
                Fechar
              </button>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="flex-1 overflow-y-auto overscroll-contain bp-modal-scroll"
            onClick={e => e.stopPropagation()}
          >
            <div className="max-w-2xl mx-auto px-4 py-3 space-y-4 pb-20">

              {/* Empty / hint */}
              {!hasQuery && (
                <div className="text-center py-10 text-slate-600">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Digite ao menos 2 caracteres</p>
                </div>
              )}

              {hasQuery && !hasResults && (
                <div className="text-center py-10 text-slate-600">
                  <p className="text-sm">Nenhum resultado para <span className="text-slate-400">"{query}"</span></p>
                </div>
              )}

              {/* Events */}
              {matchedEvents.length > 0 && (
                <section>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Shows ({matchedEvents.length})
                  </p>
                  <div className="space-y-1.5">
                    {matchedEvents.map(ev => {
                      const client = clientById[ev.client_id];
                      const st = STATUS_LABEL[ev.status] || STATUS_LABEL.scheduled;
                      const dateLabel = ev.start_date
                        ? format(parseISO(ev.start_date), "d 'de' MMM yyyy", { locale: ptBR })
                        : null;
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => {
                            hardNavigate(`/calendar`);
                            onClose();
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/50 transition-colors text-left"
                        >
                          <div
                            className="w-1.5 self-stretch rounded-full flex-shrink-0"
                            style={{ background: ev.color || '#6366f1' }}
                          />
                          <div className="flex-1 min-w-0">
                            <EventHeading event={ev} client={client} size="sm" />
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {dateLabel && (
                                <span className="text-[11px] text-slate-500">{dateLabel}</span>
                              )}
                              {(ev.location_city || ev.location) && (
                                <span className="text-[11px] text-slate-600 flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {ev.location_city || ev.location}
                                </span>
                              )}
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${st.cls}`}>
                                {st.label}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Clients */}
              {matchedClients.length > 0 && (
                <section>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Clientes ({matchedClients.length})
                  </p>
                  <div className="space-y-1.5">
                    {matchedClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          hardNavigate(`/client-detail?id=${c.id}`);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 flex-shrink-0 overflow-hidden">
                          {c.logo_url
                            ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                            : c.name?.charAt(0)?.toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{c.name}</p>
                          {c.contact_person && c.contact_person !== c.name && (
                            <p className="text-[11px] text-slate-500 truncate">{c.contact_person}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
