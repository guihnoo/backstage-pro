import { motion } from 'framer-motion';
import { CATEGORIES } from '@/lib/eventCategories';
import { Check } from 'lucide-react';
import { getCategoryConfig } from '@/lib/categoryConfig';

export default function SpecialtyPicker({ categoryId, selected, onSelect }) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  if (!category) return null;

  const { primaryHex } = getCategoryConfig(categoryId);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 mb-4">Selecione até 5 especialidades:</p>
      <div className="space-y-2">
        {category.specialties.map((specialty, idx) => (
          <motion.button
            key={specialty}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => {
              if (selected.includes(specialty)) {
                onSelect(selected.filter(s => s !== specialty));
              } else if (selected.length < 5) {
                onSelect([...selected, specialty]);
              }
            }}
            disabled={selected.length >= 5 && !selected.includes(specialty)}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
              selected.includes(specialty)
                ? 'shadow-lg'
                : 'bg-slate-800/30 border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
            style={selected.includes(specialty) ? {
              backgroundColor: `${primaryHex}33`,
              borderColor: primaryHex,
              boxShadow: `0 10px 15px -3px ${primaryHex}33`,
            } : undefined}
          >
            <span className={selected.includes(specialty) ? 'text-white font-medium' : 'text-slate-300'}>
              {specialty}
            </span>
            {selected.includes(specialty) && (
              <Check className="w-5 h-5" style={{ color: primaryHex }} />
            )}
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center mt-4">
        {selected.length}/5 selecionadas
      </p>
    </div>
  );
}
