import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, ChevronLeft, CircleDollarSign, Clock, FileText, CalendarCheck, LogOut, Receipt } from 'lucide-react';
import { useEvents } from '@/lib/useEvents';
import { useClients } from '@/lib/useClients';
import { useDailyWork } from '@/lib/useDailyWork';
import { useAuth } from '@/lib/authContext';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { todayLocalISO } from '@/components/utils/dateUtils';
import { buildPendencias, buildBaixaUpdate } from '@/lib/pendencias';
import { applyAuto12Hours } from '@/lib/applyAuto12Hours';
import { computeWorkDay, defaultDayChoice } from '@/lib/workDay';
import { getClientDisplayName } from '@/lib/eventDisplay';
import { haptics } from '@/lib/haptics';
import appToast from '@/lib/appToast';

const GRUPOS = [
  { key: 'receber', label: 'A receber', icon: CircleDollarSign, acao: 'Dar baixa', vazio: 'Tudo recebido. Nenhum trabalho esperando pagamento.' },
  { key: 'pagosSemValor', label: 'Pago sem valor', icon: Receipt, acao: 'Confirmar valores', vazio: 'Todos os pagamentos têm o valor recebido.' },
  { key: 'naoRealizados', label: 'Não fechados', icon: CalendarCheck, acao: 'Marcar como realizados', vazio: 'Todos os trabalhos que passaram estão fechados.' },
  { key: 'semHoras', label: 'Sem horas', icon: Clock, acao: 'Lançar 12 h nos dias que faltam', vazio: 'Todas as horas registradas.' },
  { key: 'saidaAberta', label: 'Saída aberta', icon: LogOut, acao: null, vazio: 'Nenhuma saída esquecida.' },
  { key: 'semNota', label: 'Sem nota', icon: FileText, acao: 'Já enviei a nota', vazio: 'Todas as notas registradas.' },
];

const br = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const periodo = (it) => (it.start === it.end ? br(it.start) : `${br(it.start)} a ${br(it.end)}`);
const nowTime = () => new Date().toTimeString().slice(0, 5);

export default function Pendencias() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { events, loading, update: updateEvent, refetch: refetchEvents } = useEvents();
  const { clients } = useClients();
  const { dailyWork, update: updateWork, refetch: refetchWork } = useDailyWork();
  const { formatCurrency, isVisible } = useFinancialVisibility();
  const money = (v) => (isVisible ? formatCurrency(Number(v) || 0) : '•••••');
  const today = todayLocalISO();

  const pend = useMemo(
    () => buildPendencias({ events, dailyWork, clients, today, now: new Date() }),
    [events, dailyWork, clients, today],
  );
  const firstWithItems = GRUPOS.find((g) => pend[g.key].length)?.key || 'receber';
  const tab = GRUPOS.some((g) => g.key === params.get('grupo')) ? params.get('grupo') : firstWithItems;
  const grupo = GRUPOS.find((g) => g.key === tab);
  const items = pend[tab];

  const [sel, setSel] = useState(() => new Set());
  const [edits, setEdits] = useState({}); // id -> { valor, data }
  const [mesmaData, setMesmaData] = useState('');
  const [busy, setBusy] = useState(false);
  const [saidas, setSaidas] = useState({});
  useEffect(() => { setSel(new Set()); setMesmaData(''); }, [tab]);

  const idOf = (it) => (tab === 'saidaAberta' ? it.work.id : it.event.id);
  const valorDe = (it) => edits[it.event.id]?.valor ?? String(it.valorPrevisto ?? 0);
  const dataDe = (it) => mesmaData || edits[it.event.id]?.data || it.dataSugerida;
  const estimadaDe = (it) => !mesmaData && !edits[it.event.id]?.data && it.dataEstimada;
  const setEdit = (id, patch) => setEdits((p) => ({ ...p, [id]: { ...p[id], ...patch } }));

  const toggle = (id) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = items.length > 0 && items.every((it) => sel.has(idOf(it)));
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(items.map(idOf)));
  const selecionados = items.filter((it) => sel.has(idOf(it)));
  const totalSel = selecionados.reduce((s, it) => s + (Number(String(valorDe(it)).replace(',', '.')) || 0), 0);

  async function executar() {
    if (!selecionados.length || busy) return;
    setBusy(true);
    let ok = 0;
    const falhas = [];
    for (const it of selecionados) {
      try {
        if (tab === 'receber') {
          await updateEvent(it.event.id, buildBaixaUpdate({ valor: String(valorDe(it)).replace(',', '.'), data: dataDe(it), estimada: estimadaDe(it) }));
        } else if (tab === 'pagosSemValor') {
          const v = Math.round(Number(String(valorDe(it)).replace(',', '.')) * 100) / 100;
          if (!Number.isFinite(v) || v < 0) throw new Error('valor inválido');
          await updateEvent(it.event.id, { paid_amount: v });
        } else if (tab === 'naoRealizados') {
          await updateEvent(it.event.id, { status: 'completed' });
        } else if (tab === 'semHoras') {
          const r = await applyAuto12Hours({ eventId: it.event.id, userId: user?.id });
          if (r?.data?.success === false) throw new Error(r.data.error);
        } else if (tab === 'semNota') {
          await updateEvent(it.event.id, { nf_issued_at: today });
        }
        ok += 1;
      } catch (err) {
        falhas.push(`${it.event.title || 'Trabalho'}: ${err.message}`);
      }
    }
    setBusy(false);
    setSel(new Set());
    if (tab === 'semHoras') refetchWork?.();
    refetchEvents?.();
    if (ok) {
      haptics.success();
      appToast.success(`${ok} ${ok === 1 ? 'trabalho resolvido' : 'trabalhos resolvidos'}`);
    }
    if (falhas.length) appToast.error(`Não deu certo em ${falhas.length}`, { description: falhas.slice(0, 3).join(' · ') });
  }

  async function registrarSaida(it) {
    const exit = saidas[it.work.id] || nowTime();
    try {
      const choice = defaultDayChoice(it.event, it.work);
      const day = computeWorkDay({ event: it.event, entry: String(it.work.entry_time).slice(0, 5), exit, regime: choice.regime, horaExtra: choice.horaExtra });
      await updateWork(it.work.id, {
        exit_time: exit, total_hours: day.totalHours, overtime_hours: day.overtimeHours, daily_cache: day.cache,
        status: 'completed', regime: day.regime || 'cheia', hora_extra: Boolean(choice.horaExtra), origem: 'lancada',
      });
      haptics.success();
      appToast.success(`Saída às ${exit} registrada · ${String(day.totalHours).replace('.', ',')}h`);
      refetchWork?.();
    } catch (err) {
      appToast.error('Não foi possível registrar a saída', { description: err.message });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-40 text-white" data-testid="pendencias">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-[#a8a8a8] text-sm mb-2">
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>
      <p className="font-tag text-[11px] tracking-[2px] text-[#a8a8a8] uppercase">Deixe tudo em dia</p>
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-poster text-[40px] leading-none uppercase">Pendências</h1>
        <motion.span key={pend.total} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
          className={`font-poster text-[28px] leading-none ${pend.total ? 'text-[#ff2e88]' : 'text-[#ffd400]'}`}>
          {loading ? '…' : pend.total}
        </motion.span>
      </div>
      <p className="text-sm text-[#a8a8a8] mt-1">Selecione vários e resolva de uma vez. O que sobrar é o que ainda falta.</p>

      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] mt-4 -mx-4 px-4 pb-1" role="tablist" aria-label="Tipos de pendência">
        {GRUPOS.map((g) => {
          const n = pend[g.key].length;
          const active = g.key === tab;
          const Icon = g.icon;
          return (
            <button key={g.key} type="button" role="tab" aria-selected={active}
              onClick={() => setParams({ grupo: g.key }, { replace: true })}
              className={`shrink-0 h-10 px-3.5 rounded-full flex items-center gap-1.5 text-[13px] font-extrabold border transition-colors ${active ? 'bg-[#ffd400] text-[#0a0a0a] border-[#ffd400]' : 'bg-[#161616] text-[#c8c8c8] border-[#2a2a2a]'}`}>
              <Icon className="w-4 h-4" />{g.label}
              <span className={`min-w-5 h-5 px-1 rounded-full text-[11px] flex items-center justify-center ${n ? (active ? 'bg-[#0a0a0a] text-[#ffd400]' : 'bg-[#ff2e88] text-white') : 'bg-transparent opacity-50'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {grupo.acao && items.length > 0 && (
        <div className="flex items-center justify-between mt-4 gap-3">
          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-5 h-5 accent-[#ffd400]" aria-label="Selecionar todos" />
            Selecionar todos ({items.length})
          </label>
          {tab === 'receber' && (
            <label className="flex items-center gap-2 text-[12px] text-[#a8a8a8]">
              Mesma data
              <input type="date" value={mesmaData} max={today} onChange={(e) => setMesmaData(e.target.value)}
                className="h-9 rounded-lg bg-[#161616] border border-[#2a2a2a] px-2 text-white text-[12px]" aria-label="Mesma data de recebimento para todos" />
            </label>
          )}
        </div>
      )}

      <div className="mt-3 space-y-2.5">
        {loading && [0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-[#161616] animate-pulse" />)}
        {!loading && items.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-[#333333] p-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className="mx-auto w-12 h-12 rounded-full bg-[#ffd400] text-[#0a0a0a] flex items-center justify-center mb-2">
              <Check className="w-6 h-6" strokeWidth={3} />
            </motion.div>
            <p className="font-poster text-[20px] uppercase">Em dia</p>
            <p className="text-sm text-[#a8a8a8]">{grupo.vazio}</p>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {!loading && items.map((it) => {
            const id = idOf(it);
            const checked = sel.has(id);
            const cliente = getClientDisplayName(it.client) || 'Sem cliente';
            return (
              <motion.section key={id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
                className={`rounded-2xl border p-3.5 flex gap-3 transition-colors ${checked ? 'bg-[#1d1a08] border-[#ffd400]' : 'bg-[#161616] border-[#222222]'}`}
                data-testid="pendencia-item">
                {grupo.acao && (
                  <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="w-5 h-5 mt-1 accent-[#ffd400] shrink-0"
                    aria-label={`Selecionar ${it.event.title || 'trabalho'}`} />
                )}
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => navigate(`/calendar?event=${it.event.id}`)} className="text-left w-full">
                    <p className="font-poster text-[18px] leading-tight uppercase truncate">{it.event.title || 'Trabalho'}</p>
                    <p className="text-[13px] text-[#c8c8c8] truncate">{cliente} · {periodo(it)}</p>
                  </button>
                  {tab === 'receber' && (
                    <>
                      <p className={`font-tag text-[11px] mt-1 ${it.diasDesdeFim >= 30 ? 'text-[#ff2e88]' : 'text-[#a8a8a8]'}`}>Terminou há {it.diasDesdeFim} dias</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <label className="text-[11px] text-[#a8a8a8]">Valor recebido
                          <input inputMode="decimal" value={isVisible ? valorDe(it) : '•••••'} disabled={!isVisible}
                            onChange={(e) => setEdit(it.event.id, { valor: e.target.value })}
                            className="mt-0.5 w-full h-10 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] px-2 text-white text-[15px] font-bold" />
                        </label>
                        <label className="text-[11px] text-[#a8a8a8]">Data {estimadaDe(it) ? '(estimada)' : ''}
                          <input type="date" value={dataDe(it)} max={today} disabled={Boolean(mesmaData)}
                            onChange={(e) => setEdit(it.event.id, { data: e.target.value })}
                            className="mt-0.5 w-full h-10 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] px-2 text-white text-[13px]" />
                        </label>
                      </div>
                    </>
                  )}
                  {tab === 'pagosSemValor' && (
                    <label className="block text-[11px] text-[#a8a8a8] mt-2">Quanto entrou (sugestão: valor do trabalho)
                      <input inputMode="decimal" value={isVisible ? valorDe(it) : '•••••'} disabled={!isVisible}
                        onChange={(e) => setEdit(it.event.id, { valor: e.target.value })}
                        className="mt-0.5 w-full h-10 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] px-2 text-white text-[15px] font-bold" />
                    </label>
                  )}
                  {tab === 'naoRealizados' && <p className="text-[12px] text-[#a8a8a8] mt-1">Ainda como “{it.event.status === 'pending' ? 'pendente' : 'confirmado'}” · {money(it.valorPrevisto)}</p>}
                  {tab === 'semHoras' && <p className="text-[12px] text-[#ff2e88] mt-1">Faltam: {it.dias.map(br).join(', ')}</p>}
                  {tab === 'semNota' && <p className="text-[12px] text-[#a8a8a8] mt-1">{money(it.valorPrevisto)} · sem nota registrada</p>}
                  {tab === 'saidaAberta' && (
                    <div className="mt-2">
                      <p className="text-[12px] text-[#ff2e88]">Entrada às {String(it.work.entry_time).slice(0, 5)} de {br(it.dia)} · {it.horasDesdeEntrada} h sem saída</p>
                      <div className="flex gap-2 mt-2">
                        <input type="time" value={saidas[it.work.id] || ''} onChange={(e) => setSaidas((p) => ({ ...p, [it.work.id]: e.target.value }))}
                          className="h-10 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] px-2 text-white" aria-label="Horário de saída" />
                        <button type="button" onClick={() => registrarSaida(it)}
                          className="flex-1 h-10 rounded-full bg-[#ffd400] text-[#0a0a0a] font-extrabold text-[13px]">
                          {saidas[it.work.id] ? `Saída às ${saidas[it.work.id]}` : 'Saída agora'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {(tab === 'naoRealizados' || tab === 'semNota') && (
                  <span className="font-poster text-[16px] text-white shrink-0">{money(it.valorPrevisto)}</span>
                )}
              </motion.section>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {grupo.acao && selecionados.length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed left-0 right-0 bottom-[84px] z-[35] px-4">
            <button type="button" onClick={executar} disabled={busy}
              className="w-full max-w-2xl mx-auto h-14 rounded-full bg-[#ffd400] text-[#0a0a0a] font-poster text-[18px] uppercase shadow-[0_8px_30px_rgba(255,212,0,0.25)] flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" strokeWidth={3} />}
              {grupo.acao} ({selecionados.length})
              {(tab === 'receber' || tab === 'pagosSemValor') && <span className="font-sans text-[14px] font-extrabold">· {money(totalSel)}</span>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
