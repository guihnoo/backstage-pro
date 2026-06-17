import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Copy, CheckCircle2, Plus } from 'lucide-react';
import appToast from '@/lib/appToast';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const MODELS = [
  { value: 'DIARIA', label: 'Diária simples' },
  { value: 'CACHE', label: 'Cachê fixo' },
  { value: 'HORAS_EXTRAS', label: 'Cachê + horas extras' },
  { value: 'MEIO_CACHE_E_DOBRA', label: 'Meio cachê / dobra' },
];

function calcTotal(days, base, model, extraHours) {
  const d = Number(days) || 1;
  const b = Number(base) || 0;
  const h = Number(extraHours) || 0;

  if (model === 'DIARIA' || model === 'CACHE') {
    return b * d;
  }
  if (model === 'HORAS_EXTRAS') {
    const overtimeRate = b / 12;
    return (b + h * overtimeRate) * d;
  }
  if (model === 'MEIO_CACHE_E_DOBRA') {
    // assumes full day (>12h) = dobra; standard < 6h = meio; else = base
    // simplified: returns base * days (user adjusts)
    return b * d;
  }
  return b * d;
}

const fmt = (v) =>
  Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });

export default function CacheCalculator({ open, onClose, onCreateEvent }) {
  const { primaryHex } = useCategoryTheme();
  const [days, setDays] = useState('1');
  const [base, setBase] = useState('');
  const [model, setModel] = useState('CACHE');
  const [extraHours, setExtraHours] = useState('0');
  const [extras, setExtras] = useState('');
  const [copied, setCopied] = useState(false);

  const total = useMemo(
    () => calcTotal(days, base, model, extraHours) + Number(extras || 0),
    [days, base, model, extraHours, extras]
  );

  const perDay = useMemo(
    () => (Number(days) > 1 ? total / Number(days) : null),
    [days, total]
  );

  const handleCopy = () => {
    const text = `Cachê: ${fmt(total)} (${days} dia${Number(days) > 1 ? 's' : ''} × ${fmt(Number(base) || 0)})`;
    navigator.clipboard.writeText(text);
    appToast.success('Copiado!', { description: text });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = () => {
    onCreateEvent?.({
      daily_cache_value: Number(base) || 0,
      payment_model: model,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white p-0 overflow-hidden bp-focus-scope">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-800">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-4 h-4" style={{ color: primaryHex }} />
            Calculadora de Cachê
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-base" className="text-xs text-slate-400">Cachê base (R$/dia)</Label>
              <Input
                id="calc-base"
                type="number"
                min="0"
                placeholder="1500"
                value={base}
                onChange={e => setBase(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-days" className="text-xs text-slate-400">Dias de trabalho</Label>
              <Input
                id="calc-days"
                type="number"
                min="1"
                value={days}
                onChange={e => setDays(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Modelo de pagamento</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {MODELS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setModel(m.value)}
                  className={`text-xs px-2.5 py-2 rounded-lg border transition-colors text-left ${
                    model === m.value
                      ? 'border-opacity-80 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                  style={model === m.value ? { borderColor: primaryHex, backgroundColor: `${primaryHex}18` } : {}}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {model === 'HORAS_EXTRAS' && (
            <div className="space-y-1.5">
              <Label htmlFor="calc-extra-hours" className="text-xs text-slate-400">Horas extras por dia</Label>
              <Input
                id="calc-extra-hours"
                type="number"
                min="0"
                value={extraHours}
                onChange={e => setExtraHours(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white h-9"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="calc-extras" className="text-xs text-slate-400">Extras (hospedagem, alimentação…)</Label>
            <Input
              id="calc-extras"
              type="number"
              min="0"
              placeholder="0"
              value={extras}
              onChange={e => setExtras(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white h-9"
            />
          </div>

          {/* Result */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center space-y-1">
            <p className="text-xs text-slate-400">Total estimado</p>
            <p className="text-3xl font-black tabular-nums" style={{ color: primaryHex }}>
              {fmt(total)}
            </p>
            {perDay && (
              <p className="text-xs text-slate-500">{fmt(perDay)} / dia × {days} dias</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 gap-2"
            >
              {copied
                ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Copiado!</>
                : <><Copy className="w-4 h-4" /> Copiar</>}
            </Button>
            <Button
              onClick={handleCreate}
              className="flex-1 gap-2 text-white"
              style={{ backgroundColor: primaryHex }}
            >
              <Plus className="w-4 h-4" /> Criar Evento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
