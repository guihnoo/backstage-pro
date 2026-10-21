import { CATEGORIES } from '@/lib/eventCategories';
import { Check } from 'lucide-react';

const MAX_SPECIALTIES = 5;

/** Escolha das especialidades (até 5). Visual All Access: selecionada = amarelo de credencial. */
export default function SpecialtyPicker({ categoryId, selected, onSelect }) {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#c8c8c8] mb-3">Selecione até {MAX_SPECIALTIES} especialidades:</p>
      <div className="space-y-2">
        {category.specialties.map((specialty) => {
          const isSelected = selected.includes(specialty);
          const blocked = selected.length >= MAX_SPECIALTIES && !isSelected;
          return (
            <button
              key={specialty}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                if (isSelected) {
                  onSelect(selected.filter((s) => s !== specialty));
                } else if (selected.length < MAX_SPECIALTIES) {
                  onSelect([...selected, specialty]);
                }
              }}
              disabled={blocked}
              className={`w-full min-h-[52px] px-4 rounded-[14px] border-2 transition-colors flex items-center justify-between bp-focus-ring ${
                isSelected
                  ? 'bg-[#ffd400] border-[#ffd400] text-[#0a0a0a]'
                  : 'bg-[#161616] border-[#2a2a2a] text-white hover:border-[#555555] disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <span className={isSelected ? 'font-extrabold' : 'font-semibold'}>{specialty}</span>
              {isSelected && <Check className="w-5 h-5" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <p className="font-tag text-[11px] text-[#a8a8a8] text-center mt-3">
        {selected.length}/{MAX_SPECIALTIES} SELECIONADAS
      </p>
    </div>
  );
}
