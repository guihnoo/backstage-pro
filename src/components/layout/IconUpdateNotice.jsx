import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';

const STORAGE_KEY = 'bp_icon_v2_notice';

/** iPhone/iPad com o app instalado na tela inicial (aberto como app, não no Safari). */
function isInstalledOnIos() {
  if (typeof navigator === 'undefined') return false;
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && navigator.standalone === true;
}

function alreadyDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * O iPhone copia o ícone da tela inicial na hora de instalar e nunca o atualiza sozinho.
 * Quem já tinha o app instalado continua vendo o ícone antigo, então avisamos uma única vez
 * como trocar. Android atualiza o ícone sozinho, por isso o aviso só aparece no iPhone/iPad.
 */
export default function IconUpdateNotice() {
  const [visible, setVisible] = useState(() => isInstalledOnIos() && !alreadyDismissed());
  const [steps, setSteps] = useState(false);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* sem armazenamento: o aviso volta na próxima abertura, sem prejuízo */
    }
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="mx-3 mt-2 rounded-[12px] bg-[#1a1a1a] px-3 py-2.5"
      style={{ borderLeft: '4px solid #ff2e88' }}
    >
      <div className="flex items-start gap-3">
        <Smartphone className="w-4 h-4 text-[#ff2e88] shrink-0 mt-0.5" aria-hidden />
        <p className="flex-1 min-w-0 text-xs text-[#c8c8c8]">
          <span className="font-extrabold text-white">Atualizamos o ícone do app.</span>{' '}
          No iPhone ele só troca se você apagar o ícone e adicionar de novo.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar aviso"
          className="shrink-0 w-9 h-9 -mt-1 -mr-1 flex items-center justify-center rounded-full text-[#9a9a9a]"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {steps && (
        <ol className="mt-2 ml-7 list-decimal space-y-1 text-xs text-[#c8c8c8]">
          <li>Segure o ícone do Backstage na tela inicial e toque em Remover app.</li>
          <li>Abra o Backstage Pro de novo no Safari, pelo mesmo link de sempre.</li>
          <li>Toque em Compartilhar e depois em Adicionar à Tela de Início.</li>
        </ol>
      )}

      <div className="mt-2 ml-7 flex gap-2">
        <button
          type="button"
          onClick={() => setSteps((s) => !s)}
          aria-expanded={steps}
          className="h-9 px-3 rounded-full bg-[#262626] text-white text-xs font-extrabold"
        >
          {steps ? 'Ocultar' : 'Como fazer'}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="h-9 px-3 rounded-full bg-[#ffd400] text-[#0a0a0a] text-xs font-extrabold"
        >
          Já fiz
        </button>
      </div>
    </div>
  );
}
