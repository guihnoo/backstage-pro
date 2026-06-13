import { useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon,
  Building,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { hardNavigate } from '@/lib/hardNavigate';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonGlass } from '@/components/design/NeonGlass';
import EventHeading from '@/components/events/EventHeading';
import { ClampedText } from '@/components/ui/overflowText';

const SNAP_WIDTH = 130;

const CATEGORY_LABELS = {
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  equipamento: 'Equipamento',
  hospedagem: 'Hospedagem',
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  outros: 'Outros',
};

const categoryColors = {
  transporte: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  alimentacao: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  hospedagem: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  equipamento: 'bg-green-500/20 text-green-300 border-green-400/30',
  combustivel: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  manutencao: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
  outros: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
};

export default function ExpenseListItem({ expense, event, client, onEdit, onDelete, onMarkReimbursed }) {
  const { isVisible, formatCurrency } = useFinancialVisibility();
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);

  function handleDragEnd(_, info) {
    const shouldReveal = info.offset.x < -40;
    if (shouldReveal) {
      animate(x, -SNAP_WIDTH, { type: 'spring', stiffness: 350, damping: 35 });
      setRevealed(true);
    } else {
      collapse();
    }
  }

  function collapse() {
    animate(x, 0, { type: 'spring', stiffness: 350, damping: 35 });
    setRevealed(false);
  }

  const statusBadge = expense.reimbursed
    ? <Badge className="bg-green-500/20 text-green-300 border-green-400/30"><CheckCircle className="w-3 h-3 mr-1"/>Reembolsado</Badge>
    : expense.is_reimbursable
      ? <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30"><AlertTriangle className="w-3 h-3 mr-1"/>A Reembolsar</Badge>
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Ações reveladas ao arrastar */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-stretch"
        style={{ width: SNAP_WIDTH }}
      >
        <button
          type="button"
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-slate-600 hover:bg-slate-500 transition-colors"
          onClick={() => { collapse(); onEdit(expense); }}
        >
          <Edit className="w-5 h-5 text-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">Editar</span>
        </button>
        <button
          type="button"
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-red-600 hover:bg-red-500 transition-colors"
          onClick={() => { collapse(); onDelete(expense.id); }}
        >
          <Trash2 className="w-5 h-5 text-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">Excluir</span>
        </button>
      </div>

      {/* Card deslizável */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -SNAP_WIDTH, right: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        onClick={revealed ? collapse : undefined}
        className="touch-pan-y cursor-grab active:cursor-grabbing"
      >
        <NeonGlass primary={config.primaryHex} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 mb-2">
              <p className="text-lg font-bold text-white truncate min-w-0" title={expense.title}>{expense.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={categoryColors[expense.category] || categoryColors.outros}>{CATEGORY_LABELS[expense.category] || expense.category}</Badge>
                {statusBadge}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{(expense.date || expense.expense_date) ? format(parseISO(expense.date || expense.expense_date), "dd/MM/yyyy", { locale: ptBR }) : '—'}</span>
              </div>
              {event && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); hardNavigate(event.client_id ? `/client-detail?id=${event.client_id}` : '/calendar'); }}
                  className="flex items-center gap-1.5 transition-colors group min-w-0 max-w-full bp-hover-primary"
                  title={event.client_id ? 'Ver página do cliente' : 'Ver na agenda'}
                >
                  <Building className="w-3.5 h-3.5 flex-shrink-0" />
                  <EventHeading event={event} client={client ?? event?.clients} size="sm" className="text-left min-w-0" />
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              )}
              {expense.receipt_url && (
                <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: config.primaryHex }}>
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Ver Recibo</span>
                </a>
              )}
            </div>
            {(expense.description || expense.notes) && (
              <ClampedText lines={2} className="text-xs text-slate-500 mt-1.5 italic">
                {[expense.description, expense.notes].filter(Boolean).join(' · ')}
              </ClampedText>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
            <p className="text-xl font-bold text-red-300">{isVisible ? formatCurrency(expense.amount) : '•••••'}</p>
            <div className="flex gap-2 items-center">
              {expense.is_reimbursable && !expense.reimbursed && onMarkReimbursed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-900/20 border-green-700/50 hover:bg-green-900/40 text-green-400 text-xs h-8 px-2"
                  onClick={() => onMarkReimbursed(expense)}
                  title="Marcar como reembolsado"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reembolsado
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-slate-700 h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </NeonGlass>
      </motion.div>
    </motion.div>
  );
}
