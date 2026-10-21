import { CATEGORIES, getIconComponent } from '@/lib/eventCategories';

/** Escolha da área de atuação. Visual All Access: selecionado = amarelo de credencial. */
export default function CategoryPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CATEGORIES.map((category) => {
        const isSelected = selected === category.id;
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(category.id)}
            className={`min-h-[72px] px-3 py-3 rounded-[14px] border-2 transition-colors bp-focus-ring flex flex-col items-center justify-center gap-1 ${
              isSelected
                ? 'bg-[#ffd400] border-[#ffd400] text-[#0a0a0a]'
                : 'bg-[#161616] border-[#2a2a2a] text-white hover:border-[#555555]'
            }`}
          >
            <span className="text-2xl leading-none" aria-hidden="true">{getIconComponent(category.icon)}</span>
            <span className="text-[14px] font-extrabold text-center leading-tight">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
