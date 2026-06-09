import { Check } from 'lucide-react';
import { BRAND_COLOR_PALETTE } from '@/lib/brandColors';

export default function ColorGridPicker({ value, onChange, label = 'Cor da empresa' }) {
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-slate-300">{label}</p>}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
        {BRAND_COLOR_PALETTE.map((swatch) => {
          const selected = value === swatch.hex;
          return (
            <button
              key={swatch.id}
              type="button"
              title={swatch.label}
              aria-label={swatch.label}
              aria-pressed={selected}
              onClick={() => onChange(swatch.hex)}
              className={`relative h-9 w-full rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                selected ? 'scale-110 ring-2 ring-white shadow-lg' : 'hover:scale-105 opacity-90 hover:opacity-100'
              }`}
              style={{
                backgroundColor: swatch.hex,
                boxShadow: selected ? `0 0 14px ${swatch.hex}99` : undefined,
              }}
            >
              {selected && (
                <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">Essa cor identifica a empresa na agenda e nos eventos.</p>
    </div>
  );
}
