import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadUserFile } from '@/lib/uploadFile';
import { useDailyWork } from '@/lib/useDailyWork';
import { X, Clock, Camera, Loader2, AlertCircle, Save, Info, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeDateString, formatDisplayDate } from '../utils/dateUtils';
import { useAppScrollLock } from '@/lib/useAppScrollLock';

export default function EventHoursSheet({ 
  isOpen, 
  onClose, 
  event, 
  initialDate,
  existingWork,
  onSave 
}) {
    const { create, update } = useDailyWork();
  useAppScrollLock(isOpen);

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

  // CRÍTICO: Inicializar formulário corretamente
  useEffect(() => {
    if (isOpen) {
      let dateToUse;

      if (existingWork?.id) {
        dateToUse = existingWork.date ? normalizeDateString(existingWork.date) : normalizeDateString(new Date());
        setFormData({
          date: dateToUse,
          entry_time: existingWork.entry_time || '',
          exit_time: existingWork.exit_time || '',
          notes: existingWork.notes || '',
          photo_url: existingWork.photo_url || ''
        });
      } else {
        // NOVO registro
        if (initialDate) {
          dateToUse = normalizeDateString(initialDate);
        } else if (event?.start_date) {
          dateToUse = normalizeDateString(event.start_date);
        } else {
          dateToUse = normalizeDateString(new Date());
        }
        
        setFormData({
          date: dateToUse,
          entry_time: event?.start_time || '',
          exit_time: event?.end_time || '',
          notes: '',
          photo_url: ''
        });
      }
      
      setErrors({});
      setTouched({});
    }
  }, [existingWork, initialDate, event, isOpen]);

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
      const { file_url } = await uploadUserFile(file, { folder: 'work-photos' });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      toast.success('Foto enviada!');
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
      toast.error('Por favor, corrija os erros');
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

      const workData = {
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
        await update(existingWork.id, workData);
        toast.success('Registro atualizado!');
      } else {
        await create(workData);
        toast.success('Registro criado!');
      }

      if (onSave) {
        onSave(workData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar registro.');
    } finally {
      setLoading(false);
    }
  };

  const hours = calculateHours(formData.entry_time, formData.exit_time);
  const estimatedCache = calculateCache(hours.total, hours.overtime);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl shadow-2xl z-[95] max-h-[90dvh] flex flex-col overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  {existingWork ? 'Editar Horas' : 'Registrar Horas'}
                </h3>
                {event && (
                  <p className="text-sm text-slate-400 mt-1 truncate">{event.title}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="bp-modal-scroll px-6 py-4 pb-safe">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="mobile_work_date" className="text-slate-300 text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Data do Trabalho *
                  </Label>
                  <Input
                    id="mobile_work_date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    onBlur={() => handleBlur('date')}
                    className={`bg-slate-800 border-slate-700 text-white h-12 text-base ${
                      errors.date && touched.date ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {/* CORREÇÃO CRÍTICA: Usar formData.date */}
                  <p className="text-xs text-slate-400">
                    {formData.date ? `Trabalho realizado em ${formatDisplayDate(formData.date)}` : 'Selecione a data'}
                  </p>
                  {errors.date && touched.date && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* Horários */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="mobile_entry_time" className="text-slate-300 text-sm font-medium">
                      Entrada *
                    </Label>
                    <Input
                      id="mobile_entry_time"
                      type="time"
                      value={formData.entry_time}
                      onChange={(e) => handleChange('entry_time', e.target.value)}
                      onBlur={() => handleBlur('entry_time')}
                      className={`bg-slate-800 border-slate-700 text-white h-12 text-base ${
                        errors.entry_time && touched.entry_time ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {errors.entry_time && touched.entry_time && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.entry_time}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_exit_time" className="text-slate-300 text-sm font-medium">
                      Saída *
                    </Label>
                    <Input
                      id="mobile_exit_time"
                      type="time"
                      value={formData.exit_time}
                      onChange={(e) => handleChange('exit_time', e.target.value)}
                      onBlur={() => handleBlur('exit_time')}
                      className={`bg-slate-800 border-slate-700 text-white h-12 text-base ${
                        errors.exit_time && touched.exit_time ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {errors.exit_time && touched.exit_time && (
                      <p className="text-red-400 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.exit_time}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cálculos */}
                {formData.entry_time && formData.exit_time && hours.total > 0 && (
                  <Alert className="bg-cyan-900/20 border-cyan-700/50">
                    <Info className="h-4 w-4 text-cyan-400" />
                    <AlertDescription className="text-cyan-200">
                      <p className="font-semibold mb-2 text-sm">Cálculo Automático</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-900/40 rounded p-2 text-center">
                          <p className="text-cyan-400 mb-1">Horas</p>
                          <p className="font-bold text-white">{hours.total.toFixed(1)}h</p>
                        </div>
                        <div className="bg-slate-900/40 rounded p-2 text-center">
                          <p className="text-cyan-400 mb-1">Extras</p>
                          <p className="font-bold text-amber-300">{hours.overtime.toFixed(1)}h</p>
                        </div>
                        <div className="bg-slate-900/40 rounded p-2 text-center">
                          <p className="text-cyan-400 mb-1">Cachê</p>
                          <p className="font-bold text-green-300">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedCache)}
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="mobile_notes" className="text-slate-300 text-sm font-medium">
                    Observações
                  </Label>
                  <Textarea
                    id="mobile_notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white min-h-[80px] text-base resize-none"
                    placeholder="Anotações..."
                  />
                </div>

                {/* Foto */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">Foto do Dia</Label>
                  <div className="flex items-center gap-2">
                    <input
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
                      className="bg-slate-800 border-slate-700 hover:bg-slate-700 h-12 flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          {formData.photo_url ? 'Trocar' : 'Adicionar'}
                        </>
                      )}
                    </Button>
                    {formData.photo_url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                        className="text-red-400 h-12 w-12"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                  {formData.photo_url && (
                    <img 
                      src={formData.photo_url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-lg border border-slate-700"
                    />
                  )}
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-slate-800 bg-slate-900/80 pb-safe">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 bg-transparent border-slate-700 hover:bg-slate-800 h-12"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !formData.date || !formData.entry_time || !formData.exit_time || Object.keys(errors).length > 0}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 h-12"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {existingWork ? 'Atualizar' : 'Salvar'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}