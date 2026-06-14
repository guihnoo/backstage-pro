import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Calendar, Users, AlertCircle, Zap, Target } from 'lucide-react';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

function formatBRLSimple(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

export default function SmartSuggestions({ userData, onSuggestionClick }) {
  const { primaryHex } = useCategoryTheme();

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
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/30'
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
      {suggestions.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSuggestionClick(suggestion.text)}
            className={`flex items-center gap-3 p-4 rounded-lg border hover:brightness-110 transition-all text-left group ${
              suggestion.themePrimary ? '' : `${suggestion.borderColor} ${suggestion.bgColor}`
            }`}
            style={suggestion.themePrimary ? {
              borderColor: `${primaryHex}4d`,
              backgroundColor: `${primaryHex}1a`,
            } : undefined}
          >
            <Icon
              className={`w-5 h-5 flex-shrink-0 ${suggestion.themePrimary ? '' : suggestion.color}`}
              style={suggestion.themePrimary ? { color: primaryHex } : undefined}
            />
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-snug">
              {suggestion.text}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
