import { LogIn, LogOut } from 'lucide-react';
import { clockNow } from '@/lib/workLogMode';

// Modo "só entrada e saída" (ideia #107): dois campos grandes, cada um com "Agora".
function Row({ id, label, icon: Icon, color, value, onChange }) {
  return (
    <div className="rounded-2xl bg-[#0a0a0a] border border-[#2a2a2a] p-3">
      <label htmlFor={id} className="font-tag text-[11px] font-bold tracking-[0.14em] flex items-center gap-1.5 mb-2" style={{ color }}>
        <Icon className="w-3.5 h-3.5" strokeWidth={2.6} />
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 h-14 rounded-xl bg-[#161616] border border-[#333333] px-3 font-poster text-[28px] text-white tracking-wide"
        />
        <button
          type="button"
          onClick={() => onChange(clockNow())}
          aria-label={`${label}: agora`}
          className="shrink-0 h-14 px-4 rounded-xl font-extrabold text-sm text-[#0a0a0a] active:scale-[0.97]"
          style={{ background: color }}
        >
          Agora
        </button>
      </div>
    </div>
  );
}

export default function PontoFields({ entry, exit, onEntryChange, onExitChange, idPrefix = 'ponto' }) {
  return (
    <div className="space-y-2" data-testid="ponto-fields">
      <Row id={`${idPrefix}-entrada`} label="ENTRADA" icon={LogIn} color="#ffd400" value={entry} onChange={onEntryChange} />
      <Row id={`${idPrefix}-saida`} label="SAÍDA" icon={LogOut} color="#ff2e88" value={exit} onChange={onExitChange} />
    </div>
  );
}
