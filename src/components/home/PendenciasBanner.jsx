import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { buildPendencias } from '@/lib/pendencias';
import { todayLocalISO } from '@/components/utils/dateUtils';

const ORDEM = [
  ['saidaAberta', (n) => `${n} saída${n > 1 ? 's' : ''} sem registro`],
  ['semHoras', (n) => `${n} trabalho${n > 1 ? 's' : ''} sem horas`],
  ['receber', (n) => `${n} para dar baixa`],
  ['pagosSemValor', (n) => `${n} pago${n > 1 ? 's' : ''} sem valor`],
  ['semNota', (n) => `${n} sem nota`],
  ['naoRealizados', (n) => `${n} para fechar`],
];

/** Faixa do Início: o que falta para o financeiro ficar real. Some quando está tudo em dia. */
export default function PendenciasBanner({ events, dailyWork, clients }) {
  const pend = useMemo(
    () => buildPendencias({ events, dailyWork, clients, today: todayLocalISO(), now: new Date() }),
    [events, dailyWork, clients],
  );
  if (!pend.total) return null;
  const partes = ORDEM.filter(([k]) => pend[k].length).map(([k, fmt]) => ({ k, txt: fmt(pend[k].length) }));
  const primeiro = partes[0]?.k;
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
      <Link to={`/pendencias?grupo=${primeiro}`} data-testid="pendencias-banner"
        className="flex items-center gap-3 rounded-2xl border border-[#ff2e88]/40 bg-[#ff2e88]/10 p-3.5 active:scale-[0.99] transition-transform">
        <span className="relative w-10 h-10 rounded-full bg-[#ff2e88] text-white flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5" />
          <span className="absolute inset-0 rounded-full bg-[#ff2e88] animate-ping opacity-25" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-tag text-[11px] tracking-[2px] uppercase text-[#ff2e88]">Pendências · {pend.total}</span>
          <span className="block text-[13px] text-white font-bold leading-snug">{partes.slice(0, 3).map((p) => p.txt).join(' · ')}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-[#ff2e88] shrink-0" />
      </Link>
    </motion.div>
  );
}
