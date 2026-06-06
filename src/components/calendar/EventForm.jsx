import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, X, Calendar as CalendarIcon, Clock, DollarSign, Palette, Building2 } from 'lucide-react';
import { Event } from '@/api/entities';
import { useAuth } from '@/lib/authContext';
import { normalizeDateString } from '@/components/utils/dateUtils';
import { toast } from 'sonner';

const PRESET_COLORS = [
  { value: '#22d3ee', label: 'Ciano' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f59e0b', label: 'Laranja' },
  { value: '#10b981', label: 'Verde' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#6366f1', label: 'Índigo' },
];

const PAYMENT_MODELS = [
  { value: 'HORAS_EXTRAS', label: 'Horas Extras (12h base)' },
  { value: 'MEIO_CACHE_E_DOBRA', label: 'Meio Cachê & Dobra' },
];

export default function EventForm({ event, clients = [], onClose, onSuccess, initialData = {} }) {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const [formData, setFormData] = useState({
    client_id: event?.client_id || initialData?.client_id || '',
    title: event?.title || '',
    start_date: event?.start_date ? normalizeDateString(event.start_date) : '',
    end_date: event?.end_date ? normalizeDateString(event.end_date) : '',
    start_time: event?.start_time || '09:00',
    end_time: event?.end_time || '18:00',
    daily_cache_value: event?.daily_cache_value || 0,
    color: event?.color || '#22d3ee',
    payment_due_date: event?.payment_due_date ? normalizeDateString(event.payment_due_date) : '',
    payment_model: event?.payment_model || 'HORAS_EXTRAS',
    cache_valor_base: event?.cache_valor_base || 0,
    observacoes_md: event?.observacoes_md || '',
  });

  // Validação em tempo real
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'client_id':
        if (!value) newErrors.client_id = 'Selecione um cliente';
        else delete newErrors.client_id;
        break;
      case 'title':
        if (!value || value.trim().length === 0) newErrors.title = 'Digite um título';
        else if (value.length > 100) newErrors.title = 'Título muito longo (máx. 100 caracteres)';
        else delete newErrors.title;
        break;
      case 'start_date':
        if (!value) newErrors.start_date = 'Selecione a data de início';
        else delete newErrors.start_date;
        break;
      case 'end_date':
        if (!value) newErrors.end_date = 'Selecione a data de término';
        else if (formData.start_date && value < formData.start_date) {
          newErrors.end_date = 'Data de término não pode ser anterior à data de início';
        } else delete newErrors.end_date;
        break;
      case 'daily_cache_value':
        if (value < 0) newErrors.daily_cache_value = 'Valor não pode ser negativo';
        else delete newErrors.daily_cache_value;
        break;
      case 'cache_valor_base':
        if (formData.payment_model === 'MEIO_CACHE_E_DOBRA' && (!value || value <= 0)) {
          newErrors.cache_valor_base = 'Valor base é obrigatório para este modelo';
        } else delete newErrors.cache_valor_base;
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

  const validateForm = () => {
    const fieldsToValidate = [
      'client_id',
      'title',
      'start_date',
      'end_date',
      'daily_cache_value'
    ];

    if (formData.payment_model === 'MEIO_CACHE_E_DOBRA') {
      fieldsToValidate.push('cache_valor_base');
    }

    let isValid = true;
    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });

    // Marcar todos os campos como touched para exibir erros
    const allTouched = {};
    fieldsToValidate.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        ...formData,
        owner_id: authUser?.id,
        daily_cache_value: parseFloat(formData.daily_cache_value) || 0,
        cache_valor_base: formData.payment_model === 'MEIO_CACHE_E_DOBRA' 
          ? parseFloat(formData.cache_valor_base) || 0 
          : null,
        start_date: normalizeDateString(formData.start_date),
        end_date: normalizeDateString(formData.end_date),
        payment_due_date: formData.payment_due_date ? normalizeDateString(formData.payment_due_date) : null,
      };

      if (event?.id) {
        await Event.update(event.id, eventData);
        toast.success('Evento atualizado com sucesso!');
      } else {
        await Event.create(eventData);
        toast.success('Evento criado com sucesso!');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === formData.client_id),
    [clients, formData.client_id]
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] bg-slate-900 border-slate-700 text-white p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
            {event ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-5">
            
            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="client_id" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Cliente *
              </Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => handleChange('client_id', value)}
              >
                <SelectTrigger 
                  id="client_id"
                  className={`w-full bg-slate-800 border-slate-700 text-white h-12 text-base ${
                    errors.client_id && touched.client_id ? 'border-red-500' : ''
                  }`}
                  onBlur={() => handleBlur('client_id')}
                >
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[300px]">
                  {clients.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      <p>Nenhum cliente cadastrado</p>
                    </div>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id} className="text-white hover:bg-slate-700 cursor-pointer py-3">
                        {client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <AnimatePresence>
                {errors.client_id && touched.client_id && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-sm flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.client_id}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-slate-200">
                Título do Evento *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder="Ex: Show no Teatro Municipal"
                className={`bg-slate-800 border-slate-700 text-white h-12 text-base ${
                  errors.title && touched.title ? 'border-red-500' : ''
                }`}
                maxLength={100}
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

            {/* Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Data de Início *
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  onBlur={() => handleBlur('start_date')}
                  className={`bg-slate-800 border-slate-700 text-white h-12 text-base ${
                    errors.start_date && touched.start_date ? 'border-red-500' : ''
                  }`}
                />
                <AnimatePresence>
                  {errors.start_date && touched.start_date && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.start_date}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Data de Término *
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  onBlur={() => handleBlur('end_date')}
                  min={formData.start_date}
                  className={`bg-slate-800 border-slate-700 text-white h-12 text-base ${
                    errors.end_date && touched.end_date ? 'border-red-500' : ''
                  }`}
                />
                <AnimatePresence>
                  {errors.end_date && touched.end_date && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.end_date}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horário de Início
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horário de Término
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-12 text-base"
                />
              </div>
            </div>

            {/* Modelo de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="payment_model" className="text-sm font-medium text-slate-200">
                Modelo de Pagamento
              </Label>
              <Select
                value={formData.payment_model}
                onValueChange={(value) => handleChange('payment_model', value)}
              >
                <SelectTrigger 
                  id="payment_model"
                  className="w-full bg-slate-800 border-slate-700 text-white h-12 text-base"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {PAYMENT_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-white hover:bg-slate-700 cursor-pointer py-3">
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valores Financeiros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily_cache_value" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cachê Diário *
                </Label>
                <Input
                  id="daily_cache_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.daily_cache_value}
                  onChange={(e) => handleChange('daily_cache_value', e.target.value)}
                  onBlur={() => handleBlur('daily_cache_value')}
                  placeholder="0.00"
                  className={`bg-slate-800 border-slate-700 text-white h-12 text-base ${
                    errors.daily_cache_value && touched.daily_cache_value ? 'border-red-500' : ''
                  }`}
                />
                <AnimatePresence>
                  {errors.daily_cache_value && touched.daily_cache_value && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.daily_cache_value}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {formData.payment_model === 'MEIO_CACHE_E_DOBRA' && (
                <div className="space-y-2">
                  <Label htmlFor="cache_valor_base" className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor Base (M&D) *
                  </Label>
                  <Input
                    id="cache_valor_base"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cache_valor_base}
                    onChange={(e) => handleChange('cache_valor_base', e.target.value)}
                    onBlur={() => handleBlur('cache_valor_base')}
                    placeholder="0.00"
                    className={`bg-slate-800 border-slate-700 text-white h-12 text-base ${
                      errors.cache_valor_base && touched.cache_valor_base ? 'border-red-500' : ''
                    }`}
                  />
                  <AnimatePresence>
                    {errors.cache_valor_base && touched.cache_valor_base && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.cache_valor_base}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Data de Vencimento */}
            <div className="space-y-2">
              <Label htmlFor="payment_due_date" className="text-sm font-medium text-slate-200">
                Data de Vencimento do Pagamento
              </Label>
              <Input
                id="payment_due_date"
                type="date"
                value={formData.payment_due_date}
                onChange={(e) => handleChange('payment_due_date', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white h-12 text-base"
              />
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cor do Evento
              </Label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange('color', color.value)}
                    className={`h-12 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 ${
                      formData.color === color.value ? 'border-white' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: color.value }}
                    aria-label={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes_md" className="text-sm font-medium text-slate-200">
                Observações
              </Label>
              <Textarea
                id="observacoes_md"
                value={formData.observacoes_md}
                onChange={(e) => handleChange('observacoes_md', e.target.value)}
                placeholder="Notas adicionais sobre o evento..."
                className="bg-slate-800 border-slate-700 text-white min-h-[100px] text-base"
              />
            </div>

            {/* Informações do Cliente Selecionado */}
            {selectedClient && (
              <Alert className="bg-cyan-900/20 border-cyan-700/50">
                <Building2 className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-cyan-200 text-sm">
                  <strong>{selectedClient.name}</strong>
                  {selectedClient.policy_default_payment_model && (
                    <span className="block mt-1 text-xs text-cyan-300">
                      Modelo padrão: {selectedClient.policy_default_payment_model === 'HORAS_EXTRAS' ? 'Horas Extras' : 'Meio Cachê & Dobra'}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t border-slate-800 flex-shrink-0 bg-slate-900/50 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-12 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white h-12 order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                event ? 'Atualizar Evento' : 'Criar Evento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}