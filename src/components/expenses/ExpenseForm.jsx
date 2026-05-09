import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Expense } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { 
  Receipt, 
  DollarSign, 
  Camera, 
  X, 
  Loader2, 
  AlertCircle, 
  Save,
  Calendar,
  CreditCard,
  Info,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { normalizeDateString, formatDisplayDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

const EXPENSE_CATEGORIES = [
  { value: 'transporte', label: '🚗 Transporte', icon: '🚗' },
  { value: 'alimentacao', label: '🍽️ Alimentação', icon: '🍽️' },
  { value: 'equipamento', label: '📷 Equipamento', icon: '📷' },
  { value: 'hospedagem', label: '🏨 Hospedagem', icon: '🏨' },
  { value: 'combustivel', label: '⛽ Combustível', icon: '⛽' },
  { value: 'manutencao', label: '🔧 Manutenção', icon: '🔧' },
  { value: 'outros', label: '📦 Outros', icon: '📦' },
];

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: '💵 Dinheiro' },
  { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
  { value: 'cartao_debito', label: '💳 Cartão de Débito' },
  { value: 'pix', label: '📱 PIX' },
  { value: 'transferencia', label: '🏦 Transferência' },
  { value: 'outros', label: '💼 Outros' },
];

export default function ExpenseForm({ 
  expense, 
  events = [], 
  onClose, 
  onSuccess,
  initialEventId = null 
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const receiptInputRef = useRef(null);

  const [formData, setFormData] = useState({
    event_id: expense?.event_id || initialEventId || '',
    title: expense?.title || '',
    description: expense?.description || '',
    amount: expense?.amount || '',
    category: expense?.category || 'outros',
    date: expense?.date ? normalizeDateString(expense.date) : normalizeDateString(new Date()),
    payment_method: expense?.payment_method || 'cartao_debito',
    receipt_url: expense?.receipt_url || '',
    is_reimbursable: expense?.is_reimbursable || false,
    notes: expense?.notes || '',
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        event_id: expense.event_id || '',
        title: expense.title || '',
        description: expense.description || '',
        amount: expense.amount || '',
        category: expense.category || 'outros',
        date: expense.date ? normalizeDateString(expense.date) : normalizeDateString(new Date()),
        payment_method: expense.payment_method || 'cartao_debito',
        receipt_url: expense.receipt_url || '',
        is_reimbursable: expense.is_reimbursable || false,
        notes: expense.notes || '',
      });
    } else {
      setFormData({
        event_id: initialEventId || '',
        title: '',
        description: '',
        amount: '',
        category: 'outros',
        date: normalizeDateString(new Date()),
        payment_method: 'cartao_debito',
        receipt_url: '',
        is_reimbursable: false,
        notes: '',
      });
    }
    setErrors({});
    setTouched({});
  }, [expense, initialEventId]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'title':
        if (!value || value.trim().length === 0) {
          newErrors.title = 'Título é obrigatório';
        } else if (value.length > 100) {
          newErrors.title = 'Título muito longo (máx. 100 caracteres)';
        } else {
          delete newErrors.title;
        }
        break;
      case 'amount':
        const numValue = parseFloat(value);
        if (!value || value === '') {
          newErrors.amount = 'Valor é obrigatório';
        } else if (isNaN(numValue)) {
          newErrors.amount = 'Valor inválido';
        } else if (numValue <= 0) {
          newErrors.amount = 'Valor deve ser maior que zero';
        } else if (numValue > 1000000) {
          newErrors.amount = 'Valor muito alto';
        } else {
          delete newErrors.amount;
        }
        break;
      case 'date':
        if (!value) {
          newErrors.date = 'Data é obrigatória';
        } else {
          delete newErrors.date;
        }
        break;
      case 'category':
        if (!value) {
          newErrors.category = 'Selecione uma categoria';
        } else {
          delete newErrors.category;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Por favor, selecione uma imagem ou PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, receipt_url: file_url }));
      toast.success('Comprovante enviado com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do comprovante.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar todos os campos obrigatórios
    const fieldsToValidate = ['title', 'amount', 'date', 'category'];
    const allTouched = {};
    fieldsToValidate.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    let isValid = true;
    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });

    if (!isValid) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        event_id: formData.event_id || null,
        description: formData.description || null,
        receipt_url: formData.receipt_url || null,
        notes: formData.notes || null,
      };

      if (expense) {
        await Expense.update(expense.id, expenseData);
        toast.success('Despesa atualizada com sucesso!');
      } else {
        await Expense.create(expenseData);
        toast.success('Despesa criada com sucesso!');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast.error('Erro ao salvar despesa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedEvent = events.find(e => e.id === formData.event_id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[95vh] max-h-[95vh] bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400 flex-shrink-0" />
              {expense ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 flex-shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
          {selectedEvent && (
            <p className="text-sm text-slate-400 mt-2 truncate">
              Vinculado ao evento: {selectedEvent.title}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 pb-safe">
            
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300 text-sm font-medium">
                Título da Despesa *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation ${
                  errors.title && touched.title ? 'border-red-500' : ''
                }`}
                placeholder="Ex: Combustível, Almoço, Estacionamento..."
                maxLength={100}
                required
              />
              <AnimatePresence>
                {errors.title && touched.title && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-sm flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.title}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300 text-sm font-medium">
                  Valor (R$) *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    onBlur={() => handleBlur('amount')}
                    className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation pl-10 ${
                      errors.amount && touched.amount ? 'border-red-500' : ''
                    }`}
                    placeholder="0,00"
                    required
                  />
                </div>
                <AnimatePresence>
                  {errors.amount && touched.amount && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.amount}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-300 text-sm font-medium">
                  Data *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  onBlur={() => handleBlur('date')}
                  className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation ${
                    errors.date && touched.date ? 'border-red-500' : ''
                  }`}
                  required
                />
                <AnimatePresence>
                  {errors.date && touched.date && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.date}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Categoria e Método de Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">
                  Categoria *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger className={`bg-slate-800 border-slate-700 text-white h-12 text-base ${
                    errors.category && touched.category ? 'border-red-500' : ''
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-slate-700 cursor-pointer">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">
                  Método de Pagamento
                </Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => handleChange('payment_method', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value} className="text-white hover:bg-slate-700 cursor-pointer">
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Evento (opcional) */}
            {events.length > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">
                  Vincular ao Evento (opcional)
                </Label>
                <Select
                  value={formData.event_id}
                  onValueChange={(value) => handleChange('event_id', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12 text-base">
                    <SelectValue placeholder="Selecione um evento..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value={null} className="text-white hover:bg-slate-700 cursor-pointer">
                      Nenhum evento
                    </SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id} className="text-white hover:bg-slate-700 cursor-pointer">
                        {event.title} - {formatDisplayDate(event.start_date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300 text-sm font-medium">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px] text-base resize-none touch-manipulation"
                placeholder="Detalhes adicionais sobre a despesa..."
              />
            </div>

            {/* Reembolsável */}
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700 rounded-lg">
              <input
                type="checkbox"
                id="is_reimbursable"
                checked={formData.is_reimbursable}
                onChange={(e) => handleChange('is_reimbursable', e.target.checked)}
                className="w-5 h-5 text-cyan-600 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500 cursor-pointer"
              />
              <Label htmlFor="is_reimbursable" className="text-slate-300 text-sm cursor-pointer flex-1">
                Esta despesa pode ser reembolsada pelo cliente
              </Label>
            </div>

            {/* Upload de Comprovante */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium mb-2 block">
                Comprovante
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  ref={receiptInputRef}
                  onChange={handleReceiptUpload}
                  accept="image/*,application/pdf"
                  capture="environment"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => receiptInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700 h-12 min-h-[44px] flex-1 sm:flex-none"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      {formData.receipt_url ? 'Trocar Comprovante' : 'Adicionar Comprovante'}
                    </>
                  )}
                </Button>
                {formData.receipt_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, receipt_url: '' }))}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-12 w-12 min-w-[44px] flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
              {formData.receipt_url && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 relative rounded-lg overflow-hidden border border-slate-700"
                >
                  {formData.receipt_url.endsWith('.pdf') ? (
                    <div className="flex items-center gap-3 p-4 bg-slate-800">
                      <FileText className="w-8 h-8 text-red-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Comprovante PDF</p>
                        <a 
                          href={formData.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:underline"
                        >
                          Visualizar arquivo
                        </a>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={formData.receipt_url} 
                      alt="Comprovante" 
                      className="w-full h-48 object-cover"
                    />
                  )}
                </motion.div>
              )}
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300 text-sm font-medium">
                Notas Adicionais
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[80px] text-base resize-none touch-manipulation"
                placeholder="Observações, contexto, lembretes..."
              />
            </div>

            {/* Preview do Valor */}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <Alert className="bg-green-900/20 border-green-700/50">
                  <Info className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-200">
                    <p className="font-semibold mb-2 text-sm">Resumo da Despesa</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-900/40 rounded-lg p-3">
                        <p className="text-xs text-green-400 mb-1">Valor Total</p>
                        <p className="font-bold text-white">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.amount))}
                        </p>
                      </div>
                      <div className="bg-slate-900/40 rounded-lg p-3">
                        <p className="text-xs text-green-400 mb-1">Categoria</p>
                        <p className="font-bold text-white text-xs">
                          {EXPENSE_CATEGORIES.find(c => c.value === formData.category)?.icon} {EXPENSE_CATEGORIES.find(c => c.value === formData.category)?.label.replace(/^.+\s/, '')}
                        </p>
                      </div>
                    </div>
                    {formData.is_reimbursable && (
                      <p className="text-xs text-green-300 mt-2">
                        💰 Reembolsável pelo cliente
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </form>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 sm:p-6 border-t border-slate-800 flex-shrink-0 bg-slate-900/50 pb-safe">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto bg-transparent border-slate-700 hover:bg-slate-800 h-12 min-h-[44px] order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white h-12 min-h-[44px] order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {expense ? 'Atualizar Despesa' : 'Salvar Despesa'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}