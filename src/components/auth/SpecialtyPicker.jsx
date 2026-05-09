import { motion } from 'framer-motion';
import { CATEGORIES } from '@/lib/eventCategories';
import { Check } from 'lucide-react';

export default function SpecialtyPicker({ categoryId, selected, onSelect }) {
  const category = CATEGORIES.find(c => c.id === categoryId);
  if (!category) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 mb-4">Selecione até 5 especialidades:</p>
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
                ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20'
                : 'bg-gray-800/30 border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <span className={selected.includes(specialty) ? 'text-white font-medium' : 'text-gray-300'}>
              {specialty}
            </span>
            {selected.includes(specialty) && (
              <Check className="w-5 h-5 text-cyan-400" />
            )}
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-gray-500 text-center mt-4">
        {selected.length}/5 selecionadas
      </p>
    </div>
  );
}
