import { useMemo, useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, ChevronDown, ChevronUp, MessageCircle, Clock } from 'lucide-react';
import { buildChargeMessage, openWhatsAppCharge } from '@/lib/whatsapp';
import { calculateEventReceivableAmount } from '@/lib/eventFinance';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import appToast from '@/lib/appToast';
import EventHeading from '@/components/events/EventHeading';
import { getClientDisplayName } from '@/lib/eventDisplay';

const BUCKETS = [
  { key: 'hot',    label: '> 90 dias', min: 90,  max: Infinity, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',    dot: 'bg-red-400' },
  { key: 'warn',   label: '61–90 dias', min: 61, max: 90,       color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-400' },
  { key: 'recent', label: '31–60 dias', min: 31, max: 60,       color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',  dot: 'bg-amber-400' },
  { key: 'new',    label: '0–30 dias',  min: 0,  max: 30,       color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
];

function getBucket(days) {
  return BUCKETS.find(b => days >= b.min && days <= b.max) || BUCKETS[3];
}

export default function ReceivablesAging({ events = [], clients = [], work = [] }) {
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const [expanded, setExpanded] = useState(false);

  const workByEvent = useMemo(() => {
    const map = {};
    work.forEach(w => {
      if (!w.event_id) return;
      if (!map[w.event_id]) map[w.event_id] = [];
      map[w.event_id].push(w);
    });
    return map;
  }, [work]);

  const overdue = useMemo(() => {
    const today = new Date();
    return events
      .filter(ev => {
        if (ev.status === 'cancelled') return false;
        // Concluídos não pagos OU eventos que já passaram mas payment_status está pending/unpaid
        const isPastDue =
          ev.status === 'completed' && ev.payment_status !== 'paid';
        return isPastDue;
      })
      .map(ev => {
        const ref = ev.end_date || ev.start_date;
        const days = ref ? Math.max(0, differenceInDays(today, parseISO(ref))) : 0;
        const wk = workByEvent[ev.id] || [];
        const amount = calculateEventReceivableAmount(ev, wk);
        const client = ev.client_id ? clients.find(c => c.id === ev.client_id) : null;
        return { ...ev, _days: days, _amount: amount, _client: client, _bucket: getBucket(days) };
      })
      .filter(ev => ev._amount > 0)
      .sort((a, b) => b._days - a._days);
  }, [events, clients, workByEvent]);

  const totalOverdue = useMemo(
    () => overdue.reduce((s, ev) => s + ev._amount, 0),
    [overdue]
  );

  const bucketSummary = useMemo(() => {
    const map = {};
    BUCKETS.forEach(b => { map[b.key] = { count: 0, total: 0, bucket: b }; });
    overdue.forEach(ev => {
      map[ev._bucket.key].count++;
      map[ev._bucket.key].total += ev._amount;
    });
    return BUCKETS.map(b => ({ ...b, ...map[b.key] })).filter(b => b.count > 0);
  }, [overdue]);

  if (!overdue.length) return null;

  const handleCharge = (ev) => {
    const client = ev._client;
    const phone = client?.phone;
    const msg = buildChargeMessage({
      clientName: getClientDisplayName(client) || ev.client_name || 'Cliente',
      events: [{ title: ev.title, start_date: ev.start_date, amount: ev._amount }],
      totalAmount: ev._amount,
    });
    if (phone) {
      openWhatsAppCharge(phone, msg);
    } else {
      navigator.clipboard?.writeText(msg).then(() =>
        appToast.success('Mensagem copiada!', { description: 'Cole no WhatsApp do cliente.' })
      );
    }
  };

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/20 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-950/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-sm font-semibold text-red-300">
              {overdue.length} pagamento{overdue.length !== 1 ? 's' : ''} em aberto
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">
              Total: {isVisible ? formatCurrency(totalOverdue) : '••••'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Bucket pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            {bucketSummary.map(b => (
              <span key={b.key} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${b.bg} ${b.color}`}>
                {b.count} {b.label}
              </span>
            ))}
          </div>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-red-400" />
            : <ChevronDown className="w-4 h-4 text-red-400" />
          }
        </div>
      </button>

      {/* Event list */}
      {expanded && (
        <div className="border-t border-red-500/20 divide-y divide-red-500/10">
          {overdue.map(ev => {
            const b = ev._bucket;
            return (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-red-950/20 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.dot}`} />
                <div className="flex-1 min-w-0">
                  <EventHeading event={ev} client={ev._client} size="sm" />
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`flex items-center gap-1 text-[10px] ${b.color}`}>
                      <Clock className="w-2.5 h-2.5" />
                      <span>{ev._days}d em atraso</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {isVisible ? formatCurrency(ev._amount) : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCharge(ev)}
                    title={ev._client?.phone ? 'Cobrar via WhatsApp' : 'Copiar mensagem de cobrança'}
                    className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Cobrar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
