import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { hardRefresh } from '@/lib/appBuild';

const CHECK_MS = 2000;
/** Tempo só mostrando carregamento antes de avisar que está demorando. */
const SLOW_AFTER_MS = 12_000;

/**
 * Rede de segurança contra "tela travada": se qualquer tela do app passa mais de 12 s mostrando
 * só os blocos cinza de carregamento (sinal fraco, servidor lento), aparece um aviso com botão.
 * Fica no layout, então vale para todas as telas sem cada uma precisar cuidar disso.
 */
export default function SlowLoadingHint() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let since = null;
    const timer = window.setInterval(() => {
      const loading = document.querySelector('main[data-app-scroll] .animate-shimmer');
      if (!loading) {
        since = null;
        setSlow(false);
        return;
      }
      since ??= Date.now();
      if (Date.now() - since >= SLOW_AFTER_MS) setSlow(true);
    }, CHECK_MS);
    return () => window.clearInterval(timer);
  }, []);

  if (!slow) return null;

  return (
    <div
      role="status"
      className="mx-3 mt-2 rounded-[12px] bg-[#1a1a1a] px-3 py-2.5 flex items-center gap-3"
      style={{ borderLeft: '4px solid #ffd400' }}
    >
      <Clock className="w-4 h-4 text-[#ffd400] shrink-0" aria-hidden />
      <p className="flex-1 min-w-0 text-xs text-[#c8c8c8]">
        <span className="font-extrabold text-white">Está demorando mais que o normal.</span>{' '}
        Pode ser o sinal do celular.
      </p>
      <button
        type="button"
        onClick={() => hardRefresh()}
        className="shrink-0 h-9 px-3 rounded-full bg-[#ffd400] text-[#0a0a0a] text-xs font-extrabold"
      >
        Tentar de novo
      </button>
    </div>
  );
}
