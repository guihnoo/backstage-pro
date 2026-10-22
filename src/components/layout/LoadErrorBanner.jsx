import { AlertTriangle } from 'lucide-react';

/**
 * Aviso de falha ao carregar, para telas que continuam abertas com números zerados:
 * deixa claro que o "0" é falta de conexão, não falta de dados.
 */
export default function LoadErrorBanner({ onRetry, what = 'seus dados' }) {
  return (
    <div
      role="alert"
      className="rounded-[12px] bg-[#1a1a1a] px-3 py-2.5 flex items-center gap-3"
      style={{ borderLeft: '4px solid #ff2e88' }}
    >
      <AlertTriangle className="w-4 h-4 text-[#ff2e88] shrink-0" aria-hidden />
      <p className="flex-1 min-w-0 text-xs text-[#c8c8c8]">
        <span className="font-extrabold text-white">Não deu para carregar {what}.</span>{' '}
        Confira a internet — os números abaixo podem estar incompletos.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 h-9 px-3 rounded-full bg-[#ffd400] text-[#0a0a0a] text-xs font-extrabold"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
