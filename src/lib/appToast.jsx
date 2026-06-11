import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Loader2, AlertTriangle } from 'lucide-react';

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
    ring: 'ring-cyan-500/30',
    icon: 'text-cyan-400',
    glow: 'shadow-cyan-500/15',
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
  const style = STYLES[type] || STYLES.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={`flex items-start gap-3 w-full max-w-[min(100vw-2rem,24rem)] rounded-xl border border-[#23262f] bg-[#0c0e14]/95 backdrop-blur-xl px-4 py-3 shadow-xl ${style.glow} ring-1 ${style.ring}`}
    >
      <Icon
        className={`w-5 h-5 shrink-0 mt-0.5 ${style.icon} ${type === 'loading' ? 'animate-spin' : ''}`}
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

export const appToast = {
  success: (title, options) => show('success', title, options),
  error: (title, options) => show('error', title, options),
  info: (title, options) => show('info', title, options),
  warning: (title, options) => show('warning', title, options),
  loading: (title, options) => show('loading', title, { ...options, duration: Infinity }),
  dismiss: (id) => toast.dismiss(id),
  promise: (promise, messages) =>
    toast.promise(promise, {
      loading: messages.loading,
      success: (data) =>
        typeof messages.success === 'function' ? messages.success(data) : messages.success,
      error: (err) =>
        typeof messages.error === 'function'
          ? messages.error(err)
          : messages.error || err?.message || 'Algo deu errado',
    }),
};

export default appToast;
