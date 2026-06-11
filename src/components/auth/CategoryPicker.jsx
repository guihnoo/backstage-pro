import { motion } from 'framer-motion';
import { CATEGORIES, getIconComponent } from '@/lib/eventCategories';

const colorMap = {
  cyan:   'from-cyan-500/20 to-cyan-600/10 border-cyan-500/50 hover:border-cyan-400',
  amber:  'from-amber-500/20 to-amber-600/10 border-amber-500/50 hover:border-amber-400',
  violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/50 hover:border-violet-400',
  green:  'from-green-500/20 to-green-600/10 border-green-500/50 hover:border-green-400',
  orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/50 hover:border-orange-400',
  pink:   'from-pink-500/20 to-pink-600/10 border-pink-500/50 hover:border-pink-400',
  purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/50 hover:border-purple-400',
  red:    'from-red-500/20 to-red-600/10 border-red-500/50 hover:border-red-400',
  yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/50 hover:border-yellow-400',
  slate:  'from-slate-500/20 to-slate-600/10 border-slate-500/50 hover:border-slate-400',
};

const selectedRingMap = {
  cyan:   'border-cyan-400 ring-cyan-500/50 shadow-cyan-500/20',
  amber:  'border-amber-400 ring-amber-500/50 shadow-amber-500/20',
  violet: 'border-violet-400 ring-violet-500/50 shadow-violet-500/20',
  green:  'border-green-400 ring-green-500/50 shadow-green-500/20',
  orange: 'border-orange-400 ring-orange-500/50 shadow-orange-500/20',
  pink:   'border-pink-400 ring-pink-500/50 shadow-pink-500/20',
  purple: 'border-purple-400 ring-purple-500/50 shadow-purple-500/20',
  red:    'border-red-400 ring-red-500/50 shadow-red-500/20',
  yellow: 'border-yellow-400 ring-yellow-500/50 shadow-yellow-500/20',
  slate:  'border-slate-400 ring-slate-500/50 shadow-slate-500/20',
};

export default function CategoryPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {CATEGORIES.map((category, idx) => (
        <motion.button
          key={category.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(category.id)}
          className={`p-6 rounded-xl border-2 transition-all ${
            selected === category.id
              ? `bg-gradient-to-br ${colorMap[category.color]} ${selectedRingMap[category.color]} ring-2 shadow-lg`
              : `bg-slate-800/30 border-slate-700 hover:border-slate-600`
          }`}
        >
          <div className="text-4xl mb-3">{getIconComponent(category.icon)}</div>
          <div className="text-sm font-semibold text-white text-center leading-tight">
            {category.label}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
