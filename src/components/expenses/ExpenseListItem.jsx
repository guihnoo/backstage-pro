import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon,
  Building
} from 'lucide-react';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { useAuth } from '@/lib/authContext';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { NeonGlass } from '@/components/design/NeonGlass';

const categoryColors = {
  transporte: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  alimentacao: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  hospedagem: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  equipamento: 'bg-green-500/20 text-green-300 border-green-400/30',
  combustivel: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  manutencao: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
  outros: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
};

export default function ExpenseListItem({ expense, event, onEdit, onDelete }) {
  const { isVisible, formatCurrency } = useFinancialVisibility();
  const { profile } = useAuth();
  const config = getCategoryConfig(profile?.category || 'lighting');

  const statusBadge = expense.reimbursed 
    ? <Badge className="bg-green-500/20 text-green-300 border-green-400/30"><CheckCircle className="w-3 h-3 mr-1"/>Reembolsado</Badge>
    : expense.is_reimbursable 
      ? <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30"><AlertTriangle className="w-3 h-3 mr-1"/>A Reembolsar</Badge>
      : null;

  return (
    <motion.div layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
    <NeonGlass primary={config.primaryHex} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 mb-2">
          <p className="text-lg font-bold text-white truncate">{expense.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={categoryColors[expense.category] || categoryColors.outros}>{expense.category}</Badge>
            {statusBadge}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          {event && (
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span className="truncate">{event.title}</span>
            </div>
          )}
          {expense.receipt_url && (
             <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Ver Recibo</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 mt-4 sm:mt-0">
        <p className="text-xl font-bold text-red-300">{isVisible ? formatCurrency(expense.amount) : '•••••'}</p>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" className="hover:bg-slate-700" onClick={() => onEdit(expense)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => onDelete(expense.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </NeonGlass>
    </motion.div>
  );
}