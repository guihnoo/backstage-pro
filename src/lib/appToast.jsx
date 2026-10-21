/* eslint-disable react-refresh/only-export-components */
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Info, Loader2, AlertTriangle } from 'lucide-react';
import { haptics } from '@/lib/haptics';

/** Sonner renderiza fora do AuthProvider — usar CSS vars, não useCategoryTheme. */
const THEME_PRIMARY = 'var(--bp-primary, #A64AFF)';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
};

const STYLES = {
  success: {
    ring: 'ring-emerald-500/30',
    icon: 'text-emerald-400',
    glow: 'shadow-emerald-500/15',
  },
  error: {
    ring: 'ring-[#ff2e88]/30',
    icon: 'text-[#ff2e88]',
    glow: 'shadow-red-500/15',
  },
  info: {
    ring: '',
    icon: '',
    glow: '',
    useTheme: true,
  },
  warning: {
    ring: 'ring-[#ffd400]/30',
    icon: 'text-[#ffd400]',
    glow: 'shadow-amber-500/15',
  },
  loading: {
    ring: 'ring-[#2a2a2a]',
    icon: 'text-[#c8c8c8]',
    glow: 'shadow-black/20',
  },
};

function BackstageToastCard({ type, title, description }) {
  const Icon = ICONS[type] || Info;
  const style = STYLES[type] || STYLES.info;
  const themeInfo = style.useTheme
    ? {
        ringStyle: { boxShadow: `0 0 0 1px color-mix(in srgb, ${THEME_PRIMARY} 30%, transparent)` },
        iconStyle: { color: THEME_PRIMARY },
        glowClass: '',
        cardStyle: { boxShadow: `0 20px 25px -5px color-mix(in srgb, ${THEME_PRIMARY} 15%, transparent)` },
      }
    : {
        ringStyle: {},
        iconStyle: {},
        glowClass: `${style.glow} ring-1 ${style.ring}`,
        cardStyle: {},
      };

  return (
    <div
      className={`bp-toast-in flex items-start gap-3 w-full max-w-[min(100vw-2rem,24rem)] rounded-xl border border-[#23262f] bg-[#0c0e14]/95 backdrop-blur-xl px-4 py-3 shadow-xl ${themeInfo.glowClass}`}
      style={themeInfo.cardStyle}
    >
      <Icon
        className={`w-5 h-5 shrink-0 mt-0.5 ${style.useTheme ? '' : style.icon} ${type === 'loading' ? 'animate-spin' : ''}`}
        style={themeInfo.iconStyle}
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-semibold text-white leading-snug">{title}</p>
        {description ? (
          <p className="text-xs text-[#a8a8a8] mt-0.5 leading-relaxed">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function show(type, title, options = {}) {
  const { description, duration = type === 'error' ? 5000 : 3500, id } = options;

  if (type === 'success') haptics.success();
  else if (type === 'error') haptics.error();
  else if (type === 'warning') haptics.medium();

  return toast.custom(
    () => <BackstageToastCard type={type} title={title} description={description} />,
    { duration, id }
  );
}

function ActionToastCard({ type = 'info', title, description, action, cancel, icon: IconOverride }) {
  const Icon = IconOverride || ICONS[type] || Info;
  const style = STYLES[type] || STYLES.info;
  const themeInfo = style.useTheme
    ? {
        ringStyle: { boxShadow: `0 0 0 1px color-mix(in srgb, ${THEME_PRIMARY} 30%, transparent)` },
        iconStyle: { color: THEME_PRIMARY },
        glowClass: '',
        cardStyle: { boxShadow: `0 20px 25px -5px color-mix(in srgb, ${THEME_PRIMARY} 15%, transparent)` },
      }
    : {
        ringStyle: {},
        iconStyle: {},
        glowClass: `${style.glow} ring-1 ${style.ring}`,
        cardStyle: {},
      };

  return (
    <div
      className={`bp-toast-in w-full max-w-[min(100vw-2rem,24rem)] rounded-xl border border-[#23262f] bg-[#0c0e14]/95 backdrop-blur-xl px-4 py-3 shadow-xl ${themeInfo.glowClass}`}
      style={themeInfo.cardStyle}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.useTheme ? '' : style.icon}`} style={themeInfo.iconStyle} />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-white leading-snug">{title}</p>
          {description ? (
            <p className="text-xs text-[#a8a8a8] mt-0.5 leading-relaxed">{description}</p>
          ) : null}
        </div>
      </div>
      {(action || cancel) && (
        <div className="flex gap-2 mt-3 justify-end">
          {cancel ? (
            <button
              type="button"
              onClick={() => {
                cancel.onClick?.();
                toast.dismiss();
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#a8a8a8] hover:text-white rounded-lg hover:bg-white/5 transition-colors min-h-[36px]"
            >
              {cancel.label || 'Cancelar'}
            </button>
          ) : null}
          {action ? (
            <button
              type="button"
              onClick={() => {
                action.onClick?.();
                toast.dismiss();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-[#06070a] bg-[#EAB308] hover:bg-[#ffd400] rounded-lg transition-colors min-h-[36px]"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export const appToast = {
  success: (title, options) => show('success', title, options),
  error: (title, options) => show('error', title, options),
  info: (title, options) => show('info', title, options),
  warning: (title, options) => show('warning', title, options),
  loading: (title, options) => show('loading', title, { ...options, duration: Infinity }),
  action: (title, options = {}) => {
    const { description, action, cancel, id, duration = Infinity, type = 'info', icon } = options;
    return toast.custom(
      () => (
        <ActionToastCard
          type={type}
          title={title}
          description={description}
          action={action}
          cancel={cancel}
          icon={icon}
        />
      ),
      { duration, id }
    );
  },
  dismiss: (id) => toast.dismiss(id),
  promise: async (promise, messages) => {
    const loadingId = show('loading', messages.loading || 'Processando...', { duration: Infinity });
    try {
      const data = await promise;
      toast.dismiss(loadingId);
      const successMsg =
        typeof messages.success === 'function' ? messages.success(data) : messages.success;
      if (successMsg) show('success', successMsg);
      return data;
    } catch (err) {
      toast.dismiss(loadingId);
      const errorMsg =
        typeof messages.error === 'function'
          ? messages.error(err)
          : messages.error || err?.message || 'Algo deu errado';
      show('error', errorMsg);
      throw err;
    }
  },
};

export default appToast;
