import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import RoadieAvatar from '@/components/roadie/RoadieAvatar';
import { buildEscalaDoDia } from '@/lib/roadie/escala';
import { todayLocalISO } from '@/components/utils/dateUtils';

/**
 * Roadie fase 3 (08/11): "Escala do dia" no Início — o que tem hoje, amanhã e a dica do Roadie.
 * Pendências (horas, saída, receber) ficam na faixa rosa logo abaixo, para não repetir.
 */
export default function EscalaDoDia({ events, dailyWork, clients }) {
  const navigate = useNavigate();
  const escala = useMemo(
    () => buildEscalaDoDia({ events, dailyWork, clients, today: todayLocalISO(), now: new Date() }),
    [events, dailyWork, clients],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="escala-do-dia"
      className="mb-5 rounded-2xl border border-[#2a2a2a] bg-[#121212] overflow-hidden"
    >
      <header className="flex items-center gap-2.5 px-3.5 pt-3">
        <RoadieAvatar size={30} />
        <p className="font-tag text-[11px] tracking-[2px] uppercase text-[#ffd400]">Escala do dia</p>
      </header>
      <ul className="px-3.5 pt-2 pb-3 space-y-1.5">
        {escala.linhas.map((l) => (
          <li key={l.rotulo} className="flex gap-2 text-[14px] leading-snug">
            <span className="w-[62px] shrink-0 font-tag text-[11px] uppercase tracking-wider text-[#8a8a8a] pt-[3px]">{l.rotulo}</span>
            <span className="min-w-0 text-white font-semibold">{l.texto}</span>
          </li>
        ))}
      </ul>
      {escala.dica && (
        <button
          type="button"
          onClick={() => navigate(escala.dica.to)}
          data-testid="escala-dica"
          className="w-full flex items-center gap-2 px-3.5 py-3 border-t border-[#222] bg-[#ffd400]/[0.06] text-left active:bg-[#ffd400]/10 min-h-[48px]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-[#ffd400]">{escala.dica.titulo}</span>
            <span className="block text-[12px] text-[#bdbdbd]">{escala.dica.texto}</span>
          </span>
          <ChevronRight className="w-5 h-5 text-[#ffd400] shrink-0" />
        </button>
      )}
    </motion.section>
  );
}
