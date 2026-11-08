import { useEffect, useRef, useState } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Briefcase, Receipt, Clock3 } from 'lucide-react';

/** Número que sobe rápido (0,6 s) até o valor — termina sempre exato. */
function CountUp({ value, format, className }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    if (reduce) { setShown(value); return undefined; }
    const controls = animate(from.current, value, {
      duration: 0.6, ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(v),
      onComplete: () => { setShown(value); from.current = value; },
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <span className={className}>{format(shown)}</span>;
}

/**
 * Topo da aba Mês do Dinheiro no visual do app (ingresso amarelo, Anton, barras animadas).
 * Mantém os rótulos "Ver detalhes: …" e os data-testid usados pelos testes.
 */
export default function FinanceMonthHero({
  received, prevReceived, revenue, pending, pendingNote, expenses,
  history = [], monthLabel, visible, formatCurrency, onOpen, receivedNote,
}) {
  const money = (v) => (visible ? formatCurrency(Number(v) || 0) : '•••••');
  const delta = Math.round(((Number(received) || 0) - (Number(prevReceived) || 0)) * 100) / 100;
  const up = delta >= 0;
  const max = Math.max(1, ...history.map((h) => h.value));

  return (
    <div className="fm-hero-wrap">
      <motion.button
        type="button"
        data-testid="finance-received"
        aria-label="Ver detalhes: Entrou no mês"
        onClick={() => onOpen('received')}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.985 }}
        className="fm-ticket"
      >
        <span className="fm-ticket-top">
          <span className="fm-tag">ENTROU EM {String(monthLabel || '').toUpperCase()}</span>
          {visible && prevReceived != null && (
            <span className={`fm-delta ${up ? 'up' : 'down'}`}>
              {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {money(Math.abs(delta))} vs mês anterior
            </span>
          )}
        </span>
        <CountUp value={Number(received) || 0} format={money} className="fm-big" />
        <span className="fm-note">{receivedNote}</span>
        {history.length > 1 && (
          <span className="fm-bars" aria-hidden="true">
            {history.map((h, i) => (
              <span key={h.month} className="fm-bar-col">
                <motion.span
                  className={`fm-bar ${i === history.length - 1 ? 'now' : ''}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (h.value / max) * 100)}%` }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
                <span className="fm-bar-label">{h.label}</span>
              </span>
            ))}
          </span>
        )}
        <span className="fm-perf" aria-hidden="true" />
      </motion.button>

      <div className="fm-kpis">
        {[
          { key: 'pending', testid: 'finance-pending', label: 'A receber', value: pending, note: pendingNote, icon: Clock3, cls: 'pink' },
          { key: 'revenue', testid: 'finance-billed', label: 'Faturamento do mês', value: revenue, note: 'Trabalhos encerrados no mês', icon: Briefcase, cls: '' },
          { key: 'expenses', testid: 'finance-expenses', label: 'Despesas do mês', value: expenses, note: 'Registradas no mês', icon: Receipt, cls: '' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.button
              key={k.key}
              type="button"
              data-testid={k.testid}
              aria-label={`Ver detalhes: ${k.label}`}
              onClick={() => onOpen(k.key)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06 }}
              whileTap={{ scale: 0.97 }}
              className={`fm-kpi ${k.cls}`}
            >
              <span className="fm-kpi-head"><Icon size={15} /><span className="fm-tag">{k.label}</span></span>
              <CountUp value={Number(k.value) || 0} format={money} className="fm-mid" />
              <span className="fm-note">{k.note}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
