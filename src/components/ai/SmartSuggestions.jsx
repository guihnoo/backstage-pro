import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Calendar, Users, AlertCircle, Zap } from 'lucide-react';

export default function SmartSuggestions({ userData, onSuggestionClick }) {
  const suggestions = useMemo(() => {
    const baseSuggestions = [
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
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30'
      },
      {
        icon: TrendingUp,
        text: 'Mostre um resumo do mês passado',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30'
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

    return baseSuggestions;
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
            transition={{ delay: index * 0.1 }}
            onClick={() => onSuggestionClick(suggestion.text)}
            className={`flex items-center gap-3 p-4 rounded-lg border ${suggestion.borderColor} ${suggestion.bgColor} hover:scale-105 transition-all text-left group`}
          >
            <Icon className={`w-5 h-5 ${suggestion.color} flex-shrink-0`} />
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              {suggestion.text}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}