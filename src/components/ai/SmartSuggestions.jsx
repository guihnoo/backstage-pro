import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Calendar, Users, AlertCircle, Zap, Target } from 'lucide-react';

function formatBRLSimple(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

export default function SmartSuggestions({ userData, onSuggestionClick }) {

  const suggestions = useMemo(() => {
    const base = [
      {
        icon: DollarSign,
        text: 'Como está meu faturamento este mês?',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      },
      {
        icon: Calendar,
        text: 'Quais eventos tenho na próxima semana?',
        themePrimary: true,
      },
      {
        icon: TrendingUp,
        text: 'Mostre um resumo do mês passado',
        themePrimary: true,
      },
      {
        icon: Users,
        text: 'Quais são meus principais clientes?',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30'
      },
      {
        icon: AlertCircle,
        text: 'Tenho pagamentos pendentes?',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30'
      },
      {
        icon: Zap,
        text: 'Dê-me insights sobre meu negócio',
        themePrimary: true,
      }
    ];

    if (!userData) return base;

    const contextual = [];

    // Pagamento pendente com valor real
    if (userData.a_receber > 0) {
      contextual.push({
        icon: AlertCircle,
        text: `Tenho ${formatBRLSimple(userData.a_receber)} a receber — como devo agir?`,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30'
      });
    }

    // Próximo show com nome
    const nextShow = userData.proximos_eventos?.[0];
    if (nextShow) {
      contextual.push({
        icon: Calendar,
        text: `Tenho show com ${nextShow.cliente || 'cliente'} — o que devo preparar?`,
        themePrimary: true,
      });
    }

    // Progresso da meta de receita
    if (userData.meta_receita > 0 && userData.faturamento_mes > 0) {
      const pct = Math.round((userData.faturamento_mes / userData.meta_receita) * 100);
      if (pct >= 50 && pct < 100) {
        contextual.push({
          icon: Target,
          text: `Estou ${pct}% da meta de receita — o que fazer para fechar o mês forte?`,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30'
        });
      }
    }

    const diariasMes = userData.diarias_mes ?? 0;
    const metaDiarias = userData.meta_diarias ?? userData.meta_eventos ?? 0;
    if (metaDiarias > 0 && diariasMes > 0) {
      const pctD = Math.round((diariasMes / metaDiarias) * 100);
      if (pctD >= 50 && pctD < 100) {
        contextual.push({
          icon: Calendar,
          text: `Trabalhei ${diariasMes} de ${metaDiarias} diárias — como acelerar até o fim do mês?`,
          themePrimary: true,
        });
      }
    }

    if (diariasMes > 0) {
      contextual.push({
        icon: TrendingUp,
        text: `Trabalhei ${diariasMes} diária${diariasMes !== 1 ? 's' : ''} este mês — como estou em relação ao mercado?`,
        themePrimary: true,
      });
    }

    // Usa contextuais se disponíveis, completa com genéricos
    const combined = [...contextual, ...base.filter(b => !contextual.find(c => c.text === b.text))];
    return combined.slice(0, 6);
  }, [userData]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
      {suggestions.map((suggestion, index) => {
        const Icon = suggestion.icon;
        // Visual All Access: mesmo cartao dos Avisos; rosa = alerta, amarelo = o resto.
        const accent = suggestion.color === 'text-red-400' ? '#ff2e88' : '#ffd400';
        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] bg-[#1a1a1a] text-left"
            style={{ borderLeft: `4px solid ${accent}` }}
          >
            <span className="w-[34px] h-[34px] rounded-[10px] text-[#0a0a0a] flex items-center justify-center shrink-0" style={{ background: accent }}>
              <Icon className="w-4 h-4" />
            </span>
            <span className="text-[13px] font-bold text-white leading-snug">
              {suggestion.text}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
