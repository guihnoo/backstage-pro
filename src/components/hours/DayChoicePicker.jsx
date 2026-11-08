import { REGIMES } from '@/lib/workDay';

const NOME = { meia: 'Meio cachê', cheia: 'Cachê cheio', dobra: 'Dobra' };

/**
 * Escolha do dia: meio cachê, cachê cheio ou dobra, e se as horas acima de 12 h contam
 * como hora extra. Cada dia do trabalho tem a sua (ex.: sexta hora extra, sábado dobra).
 * `auto` = ainda decidido pelas horas; tocar numa opção fixa a escolha deste dia.
 */
export default function DayChoicePicker({ regime, horaExtra, onChange, auto = false, accentColor = '#22d3ee' }) {
  return (
    <div className="space-y-2" data-testid="day-choice">
      <p className="text-sm font-medium text-[#c8c8c8]">
        Cachê deste dia
        {auto && <span className="ml-2 text-[11px] font-normal text-[#888888]">automático pelas horas · toque para mudar</span>}
      </p>
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
              className={`h-14 rounded-lg border text-base font-black transition-colors ${
                active ? 'text-white' : 'border-[#2a2a2a] bg-[#1f1f1f] text-[#c8c8c8] hover:border-[#2a2a2a]'
              }`}
              style={active ? { backgroundColor: accentColor, borderColor: accentColor, opacity: auto ? 0.8 : 1 } : undefined}
            >
              {r.label}
              <span className="block text-[11px] font-semibold opacity-90">{NOME[r.value]}</span>
            </button>
          );
        })}
      </div>
      <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#2a2a2a] bg-[#1f1f1f] text-sm text-[#e0e0e0]">
        <span>
          Contar hora extra neste dia
          <span className="block text-[11px] text-[#888888]">Acima de 12 h, cada hora vale cachê ÷ 12</span>
        </span>
        <input
          type="checkbox"
          checked={Boolean(horaExtra)}
          onChange={(e) => onChange({ regime: auto ? 'auto' : regime, horaExtra: e.target.checked })}
          className="w-5 h-5"
          aria-label="Contar hora extra neste dia"
        />
      </label>
    </div>
  );
}
