import { REGIMES } from '@/lib/workDay';

const NOME_CURTO = { meia: 'meia', cheia: 'cheio', dobra: 'dobra' };

/**
 * Escolha do dia (Lote 2): ½ / 1 / 2 do cachê, como combinado com o cliente,
 * e se as horas acima de 12 h contam como hora extra.
 */
export default function DayChoicePicker({ regime, horaExtra, onChange, accentColor = '#22d3ee' }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-300">Cachê deste dia</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cachê deste dia">
        {REGIMES.map((r) => {
          const active = regime === r.value;
          return (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={r.descricao}
              onClick={() => onChange({ regime: r.value, horaExtra })}
              className={`h-12 rounded-lg border text-base font-black transition-colors ${
                active ? 'text-white' : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
              }`}
              style={active ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
            >
              {r.label}
              <span className="block text-[10px] font-medium opacity-80">{NOME_CURTO[r.value]}</span>
            </button>
          );
        })}
      </div>
      <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/60 text-sm text-slate-200">
        <span>
          Contar hora extra
          <span className="block text-[11px] text-slate-500">Acima de 12 h, cada hora vale cachê ÷ 12</span>
        </span>
        <input
          type="checkbox"
          checked={Boolean(horaExtra)}
          onChange={(e) => onChange({ regime, horaExtra: e.target.checked })}
          className="w-5 h-5"
        />
      </label>
    </div>
  );
}
