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
  transporte: 'bg-[#ffd400]/20 text-[#ffd400] border-[#ffd400]/30',
  alimentacao: 'bg-[#ffd400]/20 text-[#ffd400] border-[#ffd400]/30',
  hospedagem: 'bg-[#ffd400]/20 text-[#ffd400] border-[#ffd400]/30',
  equipamento: 'bg-[#ffd400]/20 text-[#ffd400] border-[#ffd400]/30',
  combustivel: 'bg-[#ffd400]/20 text-[#ffd400] border-[#ffd400]/30',
  manutencao: 'bg-[#ff2e88]/20 text-[#ff2e88] border-[#ff2e88]/30',
  outros: 'bg-[#555555]/20 text-[#c8c8c8] border-[#444444]/30',
};

export default function ExpenseListItem({ expense, event, client, onEdit, onDelete, onMarkReimbursed, index = 0 }) {
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
    ? <Badge className="bg-[#ffd400]/20 text-[#ffd400] border-[#ffd400]/30"><CheckCircle className="w-3 h-3 mr-1"/>Reembolsado</Badge>
    : expense.is_reimbursable
      ? <Badge className="bg-[#ffd400]/20 text-[#ffd400] border-[#ffd400]/30"><AlertTriangle className="w-3 h-3 mr-1"/>A Reembolsar</Badge>
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.05, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Ações reveladas ao arrastar */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-stretch"
        style={{ width: SNAP_WIDTH }}
      >
        <button
          type="button"
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-[#333333] hover:bg-[#555555] transition-colors"
          onClick={() => { collapse(); onEdit(expense); }}
        >
          <Edit className="w-5 h-5 text-white" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">Editar</span>
        </button>
        <button
          type="button"
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-[#ff2e88] hover:bg-[#ff2e88] transition-colors"
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
            <div className="flex items-center gap-4 text-sm text-[#a8a8a8] flex-wrap">
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
              <ClampedText lines={2} className="text-xs text-[#888888] mt-1.5 italic">
                {[expense.description, expense.notes].filter(Boolean).join(' · ')}
              </ClampedText>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
            <p className="text-xl font-bold text-[#ff2e88]">{isVisible ? formatCurrency(expense.amount) : '•••••'}</p>
            <div className="flex gap-2 items-center">
              {expense.is_reimbursable && !expense.reimbursed && onMarkReimbursed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-[#ffd400]/20 border-[#ffd400]/50 hover:bg-[#ffd400]/40 text-[#ffd400] text-xs h-8 px-2"
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
                className="hover:bg-[#2a2a2a] h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
                aria-label="Editar despesa"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-[#ff2e88] hover:text-[#ff2e88] hover:bg-[#ff2e88]/20 h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                aria-label="Excluir despesa"
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
