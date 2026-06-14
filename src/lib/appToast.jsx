import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Loader2, AlertTriangle } from 'lucide-react';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

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
    ring: 'ring-red-500/30',
    icon: 'text-red-400',
    glow: 'shadow-red-500/15',
  },
  info: {
    ring: '',
    icon: '',
    glow: '',
    useTheme: true,
  },
  warning: {
    ring: 'ring-amber-500/30',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/15',
  },
  loading: {
    ring: 'ring-slate-500/30',
    icon: 'text-slate-300',
    glow: 'shadow-black/20',
  },
};

function BackstageToastCard({ type, title, description }) {
  const Icon = ICONS[type] || Info;
  const { primaryHex } = useCategoryTheme();
  const style = STYLES[type] || STYLES.info;
  const themeInfo = style.useTheme
    ? {
        ringStyle: { boxShadow: `0 0 0 1px ${primaryHex}4d` },
        iconStyle: { color: primaryHex },
        glowClass: '',
        cardStyle: { boxShadow: `0 20px 25px -5px ${primaryHex}26` },
      }
    : {
        ringStyle: {},
        iconStyle: {},
        glowClass: `${style.glow} ring-1 ${style.ring}`,
        cardStyle: {},
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={`flex items-start gap-3 w-full max-w-[min(100vw-2rem,24rem)] rounded-xl border border-[#23262f] bg-[#0c0e14]/95 backdrop-blur-xl px-4 py-3 shadow-xl ${themeInfo.glowClass}`}
      style={themeInfo.cardStyle}
    >
      <Icon
        className={`w-5 h-5 shrink-0 mt-0.5 ${style.useTheme ? '' : style.icon} ${type === 'loading' ? 'animate-spin' : ''}`}
        style={themeInfo.iconStyle}
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-semibold text-white leading-snug">{title}</p>
        {description ? (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

function show(type, title, options = {}) {
  const { description, duration = type === 'error' ? 5000 : 3500, id } = options;

  return toast.custom(
    () => <BackstageToastCard type={type} title={title} description={description} />,
    { duration, id }
  );
}

function ActionToastCard({ type = 'info', title, description, action, cancel, icon: IconOverride }) {
  const Icon = IconOverride || ICONS[type] || Info;
  const { primaryHex } = useCategoryTheme();
  const style = STYLES[type] || STYLES.info;
  const themeInfo = style.useTheme
    ? {
        ringStyle: { boxShadow: `0 0 0 1px ${primaryHex}4d` },
        iconStyle: { color: primaryHex },
        glowClass: '',
        cardStyle: { boxShadow: `0 20px 25px -5px ${primaryHex}26` },
      }
    : {
        ringStyle: {},
        iconStyle: {},
        glowClass: `${style.glow} ring-1 ${style.ring}`,
        cardStyle: {},
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={`w-full max-w-[min(100vw-2rem,24rem)] rounded-xl border border-[#23262f] bg-[#0c0e14]/95 backdrop-blur-xl px-4 py-3 shadow-xl ${themeInfo.glowClass}`}
      style={themeInfo.cardStyle}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.useTheme ? '' : style.icon}`} style={themeInfo.iconStyle} />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-white leading-snug">{title}</p>
          {description ? (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
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
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors min-h-[36px]"
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
              className="px-3 py-1.5 text-xs font-semibold text-[#06070a] bg-[#EAB308] hover:bg-amber-400 rounded-lg transition-colors min-h-[36px]"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </motion.div>
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
