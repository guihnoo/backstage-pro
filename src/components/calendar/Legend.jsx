import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const LEGEND_ITEMS = [
  { color: 'emerald', bgColor: 'bg-emerald-500', label: 'Em andamento' },
  { color: 'blue', bgColor: 'bg-blue-500', label: 'Agendado' },
  { color: 'cyan', bgColor: 'bg-cyan-500', label: 'Confirmado' },
  { color: 'amber', bgColor: 'bg-amber-500', label: 'Pendente' },
  { color: 'rose', bgColor: 'bg-rose-500', label: 'Cancelado' },
  { color: 'slate', bgColor: 'bg-slate-500', label: 'Finalizado' }
];

export default function Legend({ className = '' }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center ${className}`}
    >
      <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-400 mr-2">Status:</span>
            {LEGEND_ITEMS.map((item, index) => (
              <motion.div
                key={item.color}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-1.5"
              >
                <div 
                  className={`w-2.5 h-2.5 rounded-full ${item.bgColor} shadow-sm`}
                />
                <span className="text-xs text-slate-300 whitespace-nowrap">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}