import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronLeft, Compass } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonPageShell } from '@/components/design/NeonPageShell';
import { NeonGlass } from '@/components/design/NeonGlass';
import { USER_MANUAL_SECTIONS } from '@/lib/userManualContent';
import { APP_VERSION } from '@/lib/appVersion';
import { requestAppTour } from '@/lib/appTourBus';
import { hardNavigate } from '@/lib/hardNavigate';

function ManualSection({ section, primary, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = section.icon;

  return (
    <NeonGlass primary={primary} className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left min-w-0"
        aria-expanded={open}
      >
        <span
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{ background: `${primary}22`, border: `1px solid ${primary}44` }}
        >
          <Icon className="w-4 h-4" style={{ color: primary }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-white truncate">{section.title}</span>
          {section.route && (
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider truncate">
              {section.route}
            </span>
          )}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-4 border-t border-slate-800/80">
              {section.items.map((item) => (
                <div key={item.heading}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-1">
                    {item.heading}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.body}</p>
                </div>
              ))}
              {section.route && (
                <Link
                  to={section.route}
                  className="inline-flex text-xs font-semibold hover:underline"
                  style={{ color: primary }}
                >
                  Abrir {section.title} →
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NeonGlass>
  );
}

export default function AppHelp() {
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');

  return (
    <NeonPageShell primary={config.primaryHex} accent={config.accentHex}>
      <div className="px-4 py-5 max-w-2xl mx-auto pb-28 space-y-5">
        <div className="flex items-start gap-3">
          <Link
            to="/profile"
            className="mt-1 flex items-center justify-center w-10 h-10 rounded-full border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800/50 shrink-0"
            aria-label="Voltar ao perfil"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 shrink-0" style={{ color: config.primaryHex }} />
              <h1 className="text-xl font-extrabold text-white truncate">Manual do app</h1>
            </div>
            <p className="text-sm text-slate-500">
              Guia por área — Backstage Pro v{APP_VERSION}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            hardNavigate('/');
            window.setTimeout(() => requestAppTour(), 400);
          }}
          className="w-full flex items-center gap-3 p-4 rounded-xl border transition-colors hover:bg-slate-800/30 text-left"
          style={{ borderColor: `${config.primaryHex}40`, background: `${config.primaryHex}0a` }}
        >
          <Compass className="w-5 h-5 shrink-0" style={{ color: config.primaryHex }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Prefere um tour visual?</p>
            <p className="text-xs text-slate-500">Reinicia o passo a passo na Home</p>
          </div>
        </button>

        <div className="space-y-3">
          {USER_MANUAL_SECTIONS.map((section, index) => (
            <ManualSection
              key={section.id}
              section={section}
              primary={config.primaryHex}
              defaultOpen={index === 0}
            />
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 pt-2">
          Dúvidas ou sugestões?{' '}
          <Link to="/profile" className="underline hover:text-slate-400">
            Perfil → Suporte & Feedback
          </Link>
        </p>
      </div>
    </NeonPageShell>
  );
}
