import { LITE_MOTION } from '@/lib/liteMotion';

/**
 * Peças visuais da Entrada (login, cadastro, senha) no estilo All Access.
 * Só aparência: nenhuma lógica de acesso passa por aqui.
 * Animações em loop ficam desligadas no celular/aparelho modesto (LITE_MOTION).
 */

const MARQUEE_TEXT =
  'LUZ ✦ ÁUDIO ✦ PRODUÇÃO ✦ LED ✦ RIGGING ✦ PALCO ✦ BACKLINE ✦ CENOGRAFIA ✦ ';

export function AuthScreen({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden relative ${className}`}
    >
      <div className="relative z-10 min-h-screen flex flex-col max-w-lg mx-auto">{children}</div>
    </div>
  );
}

/** Feixe de luz de refletor. Parado no celular, balançando em telas grandes. */
export function BeamHero({ children, height = 300 }) {
  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <div
        aria-hidden="true"
        className={`aa-beam ${LITE_MOTION ? '' : 'aa-beam-sweep'}`}
        style={{
          position: 'absolute',
          top: -40,
          left: '50%',
          marginLeft: -110,
          width: 220,
          height: 520,
          background: 'linear-gradient(180deg, rgba(255,212,0,.28), transparent 75%)',
          clipPath: 'polygon(45% 0, 55% 0, 100% 100%, 0 100%)',
          pointerEvents: 'none',
          transformOrigin: 'top center',
        }}
      />
      <div className="relative h-full flex flex-col justify-end px-[22px] pb-[18px]">{children}</div>
    </div>
  );
}

export function MarqueeBand() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden bg-[#ffd400] text-[#0a0a0a] h-[30px] flex items-center"
    >
      <div
        className={`whitespace-nowrap font-poster text-[15px] tracking-[2px] ${LITE_MOTION ? '' : 'aa-marquee'}`}
      >
        {MARQUEE_TEXT}
        {MARQUEE_TEXT}
        {MARQUEE_TEXT}
      </div>
    </div>
  );
}

export function AuthLabel({ htmlFor, children, className = '' }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block font-tag text-[11px] tracking-[1px] text-[#a8a8a8] uppercase mb-1.5 ${className}`}
    >
      {children}
    </label>
  );
}

export const AA_INPUT_CLASS =
  'w-full h-[52px] rounded-[14px] border border-[#333333] bg-[#161616] text-white text-base px-4 ' +
  'placeholder:text-[#6a6a6a] focus:outline-none focus:border-[#ffd400] focus:ring-2 focus:ring-[#ffd400]/40';

export function AuthPrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="submit"
      {...props}
      className={`w-full h-14 rounded-[28px] border-0 bg-[#ffd400] text-[#0a0a0a] font-poster text-[22px] tracking-[2px] uppercase ` +
        `disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
    >
      {children}
    </button>
  );
}

export function AuthLinkButton({ children, tone = 'muted', className = '', ...props }) {
  const color = tone === 'accent' ? 'text-[#ffd400] font-extrabold' : 'text-[#c8c8c8]';
  return (
    <button
      type="button"
      {...props}
      className={`bg-transparent border-0 text-sm py-2 ${color} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffd400] rounded-sm ${className}`}
    >
      {children}
    </button>
  );
}

/** Aviso de erro/atenção. tone: 'error' (rosa) | 'warn' (amarelo) */
export function AuthNotice({ tone = 'error', title, children }) {
  const color = tone === 'warn' ? '#ffd400' : '#ff2e88';
  return (
    <div
      role="alert"
      className="rounded-2xl bg-[#161616] p-3.5 space-y-1"
      style={{ border: `2px solid ${color}` }}
    >
      {title && (
        <p className="font-poster text-xl leading-none" style={{ color }}>
          {title}
        </p>
      )}
      <div className="text-sm text-[#e0e0e0] leading-snug">{children}</div>
    </div>
  );
}
