import { useMemo, useState } from 'react';
import { useRoadieActions } from './roadieActionsContext';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { parseRoadieAction, describeRoadieAction } from '@/lib/roadie/actions';
import { buildChargeMessage, openWhatsAppCharge } from '@/lib/whatsapp';
import { confetti } from '@/lib/celebrate';
import appToast from '@/lib/appToast';

/**
 * Roadie fase 2 (08/11): a página do Roadie fornece os dados e as gravações;
 * cada botão "/acao/..." da resposta vira um cartão que só grava depois do "Confirmar".
 */
export default function RoadieActionCard({ href, children }) {
  const ctx = useRoadieActions();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState('pronto'); // pronto | gravando | feito
  const acao = useMemo(() => parseRoadieAction(href), [href]);
  const info = useMemo(
    () => (ctx && acao ? describeRoadieAction(acao, ctx) : null),
    [ctx, acao],
  );

  if (!acao) return null;

  const confirmar = async () => {
    if (!info?.ok || estado !== 'pronto') return;
    if (info.navegar) {
      navigate(info.navegar);
      return;
    }
    if (info.cobranca) {
      const { evento, cliente, valor } = info.cobranca;
      const msg = buildChargeMessage({ clientName: cliente?.contact_person || cliente?.name, events: [{ ...evento, amount: valor }], totalAmount: valor });
      if (!openWhatsAppCharge(cliente?.phone, msg)) {
        appToast.info('Cliente sem WhatsApp cadastrado', { description: 'Abra o cliente e adicione o telefone.' });
        return;
      }
      setEstado('feito');
      return;
    }
    setEstado('gravando');
    try {
      await ctx.gravar(info.gravacao);
      setEstado('feito');
      if (acao.tipo === 'baixa') confetti();
      appToast.success(acao.tipo === 'baixa' ? 'Baixa registrada!' : 'Registro salvo!');
    } catch (err) {
      console.error('[roadie] ação falhou', err);
      setEstado('pronto');
      appToast.error('Não consegui salvar. Tente de novo.');
    }
  };

  if (estado === 'feito') {
    return (
      <span data-testid="roadie-acao-feita" className="inline-flex items-center gap-1.5 my-1 mr-1 min-h-[44px] px-4 rounded-full bg-[#1f3a1f] text-[#9be29b] font-extrabold text-[13px]">
        <Check className="w-4 h-4" /> Feito
      </span>
    );
  }

  return (
    <span className="block my-1.5 not-prose">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        data-testid="roadie-acao"
        aria-expanded={aberto}
        className="inline-flex items-center gap-1 min-h-[44px] px-4 rounded-full bg-[#ffd400] text-[#0a0a0a] font-extrabold text-[13px] no-underline"
      >
        {children} <ChevronRight className={`w-4 h-4 transition-transform ${aberto ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="block overflow-hidden"
          >
            <span data-testid="roadie-confirmacao" className="block mt-2 rounded-2xl border border-[#ffd400]/50 bg-[#141414] p-3">
              <span className="block font-bold text-[14px] text-white">{info?.titulo || 'Preparando…'}</span>
              {info?.ok ? (
                info.linhas.map((l) => <span key={l} className="block text-[13px] text-[#c8c8c8] mt-0.5">{l}</span>)
              ) : (
                <span className="block text-[13px] text-[#ff8fbf] mt-0.5">{info?.erro || 'Abra o Roadie pela tela dele para usar esta ação.'}</span>
              )}
              <span className="flex gap-2 mt-3">
                {info?.ok && (
                  <button
                    type="button"
                    onClick={confirmar}
                    disabled={estado === 'gravando'}
                    data-testid="roadie-confirmar"
                    className="flex-1 min-h-[44px] rounded-full bg-[#ffd400] text-[#0a0a0a] font-extrabold text-[14px] flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {estado === 'gravando' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {info.confirmar}
                  </button>
                )}
                <button type="button" onClick={() => setAberto(false)} className="min-h-[44px] px-4 rounded-full border border-[#333] text-white font-bold text-[14px]">
                  {info?.ok ? 'Agora não' : 'Fechar'}
                </button>
              </span>
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
