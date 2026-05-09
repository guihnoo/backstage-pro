import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DailyWork } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { useAppData } from '@/components/context/AppDataContext';
import { Clock, DollarSign, Camera, X, Loader2, AlertCircle, Save, Info, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeDateString, formatDisplayDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

export default function DailyWorkModal({ 
  isOpen, 
  onClose, 
  date, 
  event, 
  existingWork,
  onSuccess 
}) {
  const { data: { user } } = useAppData();

  const [formData, setFormData] = useState({
    date: '',
    entry_time: '',
    exit_time: '',
    notes: '',
    photo_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const photoInputRef = useRef(null);

  // CRÍTICO: Inicializar formulário corretamente quando modal abre
  useEffect(() => {
    console.log('📅 DailyWorkModal opened with:', { date, existingWork, event });
    
    if (isOpen) {
      let initialDate;
      
      if (existingWork?.id) {
        // EDITANDO trabalho existente - usar data do trabalho
        initialDate = existingWork.date ? normalizeDateString(existingWork.date) : normalizeDateString(new Date());
        console.log('✏️ Editando trabalho existente, data:', initialDate);
        
        setFormData({
          date: initialDate,
          entry_time: existingWork.entry_time || '',
          exit_time: existingWork.exit_time || '',
          notes: existingWork.notes || '',
          photo_url: existingWork.photo_url || ''
        });
      } else {
        // NOVO registro - prioridade: date prop > event start_date > hoje
        if (date) {
          initialDate = normalizeDateString(date);
          console.log('📆 Nova entrada para data clicada:', initialDate);
        } else if (event?.start_date) {
          initialDate = normalizeDateString(event.start_date);
          console.log('🎯 Nova entrada para evento, usando start_date:', initialDate);
        } else {
          initialDate = normalizeDateString(new Date());
          console.log('📅 Nova entrada, usando data atual:', initialDate);
        }
        
        setFormData({
          date: initialDate,
          entry_time: event?.start_time || '',
          exit_time: event?.end_time || '',
          notes: '',
          photo_url: ''
        });
      }
      
      setErrors({});
      setTouched({});
    }
  }, [existingWork, date, event, isOpen]);

  const calculateHours = (entry, exit) => {
    if (!entry || !exit) return { total: 0, overtime: 0 };
    
    const [entryH, entryM] = entry.split(':').map(Number);
    const [exitH, exitM] = exit.split(':').map(Number);
    
    let entryMinutes = entryH * 60 + entryM;
    let exitMinutes = exitH * 60 + exitM;
    
    if (exitMinutes < entryMinutes) {
      exitMinutes += 24 * 60;
    }
    
    const totalMinutes = exitMinutes - entryMinutes;
    const totalHours = totalMinutes / 60;
    
    const standardHours = 12;
    const overtime = Math.max(0, totalHours - standardHours);
    
    return { total: Math.round(totalHours * 10) / 10, overtime: Math.round(overtime * 10) / 10 };
  };

  const calculateCache = (totalHours, overtimeHours) => {
    if (!event) return 0;

    const paymentModel = event.payment_model || 'HORAS_EXTRAS';
    const baseValue = event.daily_cache_value || 0;

    if (paymentModel === 'MEIO_CACHE_E_DOBRA') {
      const cacheBase = event.cache_valor_base || baseValue;
      
      if (totalHours <= 6) {
        return Math.round((cacheBase / 2) * 100) / 100;
      } else if (totalHours <= 12) {
        return Math.round(baseValue * 100) / 100;
      } else {
        return Math.round((cacheBase * 2) * 100) / 100;
      }
    }

    const overtimeRate = baseValue / 12;
    return Math.round((baseValue + (overtimeHours * overtimeRate)) * 100) / 100;
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'date':
        if (!value) newErrors.date = 'Data é obrigatória';
        else delete newErrors.date;
        break;
      case 'entry_time':
        if (!value) newErrors.entry_time = 'Horário de entrada é obrigatório';
        else delete newErrors.entry_time;
        break;
      case 'exit_time':
        if (!value) newErrors.exit_time = 'Horário de saída é obrigatório';
        else if (formData.entry_time && value <= formData.entry_time) {
          newErrors.exit_time = 'Horário de saída deve ser depois do horário de entrada';
        } else delete newErrors.exit_time;
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name, value) => {
    console.log(`🔄 Mudando ${name} para:`, value);
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = { date: true, entry_time: true, exit_time: true };
    setTouched(allTouched);

    if (!validateField('date', formData.date) || 
        !validateField('entry_time', formData.entry_time) || 
        !validateField('exit_time', formData.exit_time)) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    if (!event) {
      toast.error('Nenhum evento selecionado');
      return;
    }

    setLoading(true);

    try {
      const { total, overtime } = calculateHours(formData.entry_time, formData.exit_time);
      const dailyCache = calculateCache(total, overtime);

      const normalizedDate = normalizeDateString(formData.date);
      console.log('💾 Salvando trabalho com data:', normalizedDate);

      const workData = {
        owner_id: user.id,
        event_id: event.id,
        date: normalizedDate,
        entry_time: formData.entry_time,
        exit_time: formData.exit_time,
        total_hours: total,
        overtime_hours: overtime,
        daily_cache: dailyCache,
        notes: formData.notes || null,
        photo_url: formData.photo_url || null
      };

      if (existingWork?.id) {
        await DailyWork.update(existingWork.id, workData);
        toast.success('Registro de trabalho atualizado com sucesso!');
      } else {
        await DailyWork.create(workData);
        toast.success('Registro de trabalho criado com sucesso!');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      toast.error('Erro ao salvar registro.', {
        description: error.response?.data?.message || error.message || 'Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const hours = calculateHours(formData.entry_time, formData.exit_time);
  const estimatedCache = calculateCache(hours.total, hours.overtime);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[95vh] max-h-[95vh] bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white p-0 flex flex-col overflow-hidden">
        <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }, exit: { opacity: 0, y: -20, transition: { duration: 0.2 } } }} initial="hidden" animate="visible" exit="hidden" className="flex flex-col h-full">
          
          <DialogHeader className="p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                {existingWork ? 'Editar Registro de Trabalho' : 'Novo Registro de Trabalho'}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 flex-shrink-0">
                <X className="w-5 h-5" />
              </Button>
            </div>
            {event && (
              <p className="text-sm text-slate-400 mt-2 truncate">
                {event.title}
              </p>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 pb-safe">
              
              {/* Data do Trabalho */}
              <div className="space-y-2">
                <Label htmlFor="work_date" className="text-slate-300 text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Data do Trabalho *
                </Label>
                <Input
                  id="work_date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  onBlur={() => handleBlur('date')}
                  className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation ${
                    errors.date && touched.date ? 'border-red-500' : ''
                  }`}
                  required
                />
                {/* CORREÇÃO CRÍTICA: Usar formData.date para a mensagem */}
                <p className="text-xs text-slate-400">
                  {formData.date ? `Trabalho realizado em ${formatDisplayDate(formData.date)}` : 'Selecione a data do trabalho'}
                </p>
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

              {/* Horários */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry_time" className="text-slate-300 text-sm font-medium">
                    Horário de Entrada *
                  </Label>
                  <Input
                    id="entry_time"
                    type="time"
                    value={formData.entry_time}
                    onChange={(e) => handleChange('entry_time', e.target.value)}
                    onBlur={() => handleBlur('entry_time')}
                    className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation ${
                      errors.entry_time && touched.entry_time ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <AnimatePresence>
                    {errors.entry_time && touched.entry_time && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.entry_time}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exit_time" className="text-slate-300 text-sm font-medium">
                    Horário de Saída *
                  </Label>
                  <Input
                    id="exit_time"
                    type="time"
                    value={formData.exit_time}
                    onChange={(e) => handleChange('exit_time', e.target.value)}
                    onBlur={() => handleBlur('exit_time')}
                    className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation ${
                      errors.exit_time && touched.exit_time ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  <AnimatePresence>
                    {errors.exit_time && touched.exit_time && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.exit_time}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Preview de Cálculos */}
              <AnimatePresence>
                {formData.entry_time && formData.exit_time && hours.total > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert className="bg-cyan-900/20 border-cyan-700/50">
                      <Info className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      <AlertDescription className="text-cyan-200">
                        <p className="font-semibold mb-3 text-sm">Cálculo Automático</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div className="bg-slate-900/40 rounded-lg p-3">
                            <p className="text-xs text-cyan-400 mb-1">Total de Horas</p>
                            <p className="font-bold text-white">{hours.total.toFixed(1)}h</p>
                          </div>
                          <div className="bg-slate-900/40 rounded-lg p-3">
                            <p className="text-xs text-cyan-400 mb-1">Horas Extras</p>
                            <p className="font-bold text-amber-300">{hours.overtime.toFixed(1)}h</p>
                          </div>
                          <div className="bg-slate-900/40 rounded-lg p-3 sm:col-span-1 col-span-2">
                            <p className="text-xs text-cyan-400 mb-1">Cachê Estimado</p>
                            <p className="font-bold text-green-300">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedCache)}
                            </p>
                          </div>
                        </div>
                        {event?.payment_model && (
                          <p className="text-xs text-cyan-300 mt-3">
                            📊 Modelo: {event.payment_model === 'HORAS_EXTRAS' ? 'Horas Extras' : 'Meio Cachê & Dobra'}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-300 text-sm font-medium">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px] text-base resize-none touch-manipulation"
                  placeholder="Anotações sobre o dia de trabalho..."
                />
              </div>

              {/* Upload de Foto */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium mb-2 block">
                  Foto do Dia
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => photoInputRef.current?.click()}
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
                        {formData.photo_url ? 'Trocar Foto' : 'Adicionar Foto'}
                      </>
                    )}
                  </Button>
                  {formData.photo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-12 w-12 min-w-[44px] flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                {formData.photo_url && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 relative rounded-lg overflow-hidden border border-slate-700"
                  >
                    <img 
                      src={formData.photo_url} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                  </motion.div>
                )}
              </div>
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
                disabled={loading || !formData.date || !formData.entry_time || !formData.exit_time || Object.keys(errors).length > 0}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white h-12 min-h-[44px] order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {existingWork ? 'Atualizar Registro' : 'Salvar Registro'}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}