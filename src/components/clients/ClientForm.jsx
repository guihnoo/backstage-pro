import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, DollarSign, X, AlertCircle, Phone, Mail, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/authContext';
import { useClients } from '@/lib/useClients';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientForm({ client, onSuccess, onCancel }) {
  const { user } = useAuth();
  const { create: createClient, update: updateClient } = useClients();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    logo_url: '',
    invoice_portal_url: '',
    notes: '',
    policy_default_payment_model: null,
    policy_allows_meio_e_dobra_juntos: false,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        logo_url: client.logo_url || '',
        invoice_portal_url: client.invoice_portal_url || '',
        notes: client.notes || '',
        policy_default_payment_model: client.policy_default_payment_model || null,
        policy_allows_meio_e_dobra_juntos: client.policy_allows_meio_e_dobra_juntos || false,
      });
    } else {
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        logo_url: '',
        invoice_portal_url: '',
        notes: '',
        policy_default_payment_model: null,
        policy_allows_meio_e_dobra_juntos: false,
      });
    }
    setErrors({});
    setTouched({});
  }, [client]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) {
          newErrors.name = 'Nome do cliente é obrigatório';
        } else if (value.length > 100) {
          newErrors.name = 'Nome muito longo (máx. 100 caracteres)';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'E-mail inválido';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (value && value.length > 20) {
          newErrors.phone = 'Telefone muito longo';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'logo_url':
      case 'invoice_portal_url':
        if (value && !/^https?:\/\/.+/.test(value)) {
          newErrors[name] = 'URL inválida (deve começar com http:// ou https://)';
        } else {
          delete newErrors[name];
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campo obrigatório
    setTouched({ name: true });
    if (!validateField('name', formData.name)) {
      toast.error('Por favor, preencha o nome do cliente');
      return;
    }

    // Validar outros campos se preenchidos
    const fieldsToValidate = ['email', 'phone', 'logo_url', 'invoice_portal_url'];
    let isValid = true;
    fieldsToValidate.forEach(field => {
      if (formData[field] && !validateField(field, formData[field])) {
        isValid = false;
      }
    });

    if (!isValid) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      if (!user?.id) {
        toast.error('Sessao expirada. Faca login novamente.');
        return;
      }

      const clientData = {
        name: formData.name.trim(),
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        logo_url: formData.logo_url || null,
        notes: formData.notes || null,
        policy_default_payment_model: formData.policy_default_payment_model || null,
        policy_allows_meio_e_dobra_juntos: formData.policy_allows_meio_e_dobra_juntos || false,
      };

      let result;
      if (client?.id) {
        result = await updateClient(client.id, clientData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        result = await createClient(clientData);
        toast.success('Cliente criado com sucesso!');
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error('Erro ao salvar cliente.', {
        description: error?.message || 'Ocorreu um problema. Por favor, tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl h-[95vh] max-h-[95vh] bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-10 w-10 flex-shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <DialogDescription className="text-slate-400 text-sm mt-2">
            {client ? 'Atualize as informações do cliente.' : 'Adicione um novo cliente ao seu portfólio.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 pb-safe">
            
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                Informações Básicas
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300 text-sm font-medium">
                  Nome do Cliente *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation ${
                    errors.name && touched.name ? 'border-red-500' : ''
                  }`}
                  placeholder="Ex: Empresa ABC"
                  maxLength={100}
                  required
                />
                <AnimatePresence>
                  {errors.name && touched.name && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-sm flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person" className="text-slate-300 text-sm font-medium">
                  Pessoa de Contato
                </Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation pl-10 ${
                        errors.email && touched.email ? 'border-red-500' : ''
                      }`}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && touched.email && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-300 text-sm font-medium">
                    Telefone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation pl-10 ${
                        errors.phone && touched.phone ? 'border-red-500' : ''
                      }`}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Políticas de Pagamento */}
            <div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <h3 className="text-base sm:text-lg font-medium text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                Políticas de Pagamento
              </h3>

              <div className="space-y-3">
                <Label className="text-slate-300 text-sm font-medium">
                  Modelo de Pagamento Padrão
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                  Modelo que será usado por padrão ao criar novos eventos para este cliente.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant={!formData.policy_default_payment_model ? 'default' : 'outline'}
                    onClick={() => handleChange('policy_default_payment_model', null)}
                    className="h-auto p-3 sm:p-4 justify-start bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 w-full text-left min-h-[44px]"
                  >
                    <div className="w-full">
                      <div className="font-medium text-sm text-white">Padrão do Sistema</div>
                      <div className="text-xs opacity-80 text-slate-400">Horas Extras (12h base)</div>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant={formData.policy_default_payment_model === 'HORAS_EXTRAS' ? 'default' : 'outline'}
                    onClick={() => handleChange('policy_default_payment_model', 'HORAS_EXTRAS')}
                    className="h-auto p-3 sm:p-4 justify-start bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 w-full text-left min-h-[44px]"
                  >
                    <div className="w-full">
                      <div className="font-medium text-sm text-white">Horas Extras</div>
                      <div className="text-xs opacity-80 text-slate-400">Cachê base + horas extras</div>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant={formData.policy_default_payment_model === 'MEIO_CACHE_E_DOBRA' ? 'default' : 'outline'}
                    onClick={() => handleChange('policy_default_payment_model', 'MEIO_CACHE_E_DOBRA')}
                    className="h-auto p-3 sm:p-4 justify-start bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 w-full text-left min-h-[44px]"
                  >
                    <div className="w-full">
                      <div className="font-medium text-sm text-white">Meio Cachê & Dobra</div>
                      <div className="text-xs opacity-80 text-slate-400">Valores fixos por faixa de horas</div>
                    </div>
                  </Button>
                </div>
              </div>

              {formData.policy_default_payment_model === 'MEIO_CACHE_E_DOBRA' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg"
                >
                  <input
                    type="checkbox"
                    id="allows_meio_e_dobra_juntos"
                    checked={formData.policy_allows_meio_e_dobra_juntos}
                    onChange={(e) => handleChange('policy_allows_meio_e_dobra_juntos', e.target.checked)}
                    className="mt-1 w-5 h-5 text-purple-600 bg-purple-800 border-purple-700 rounded focus:ring-purple-500 cursor-pointer flex-shrink-0"
                  />
                  <div>
                    <Label htmlFor="allows_meio_e_dobra_juntos" className="text-purple-200 font-medium cursor-pointer text-sm">
                      Permitir Meio Cachê + Dobra no mesmo dia
                    </Label>
                    <p className="text-xs text-purple-300 mt-1">
                      Permite aplicar "Meio Cachê" e "Dobra" simultaneamente em um único evento.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* URLs */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url" className="text-slate-300 text-sm font-medium">
                    URL da Logo
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="logo_url"
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => handleChange('logo_url', e.target.value)}
                      onBlur={() => handleBlur('logo_url')}
                      className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation pl-10 ${
                        errors.logo_url && touched.logo_url ? 'border-red-500' : ''
                      }`}
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                  <AnimatePresence>
                    {errors.logo_url && touched.logo_url && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.logo_url}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_portal_url" className="text-slate-300 text-sm font-medium">
                    Portal de NF-e
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="invoice_portal_url"
                      type="url"
                      value={formData.invoice_portal_url}
                      onChange={(e) => handleChange('invoice_portal_url', e.target.value)}
                      onBlur={() => handleBlur('invoice_portal_url')}
                      className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation pl-10 ${
                        errors.invoice_portal_url && touched.invoice_portal_url ? 'border-red-500' : ''
                      }`}
                      placeholder="https://portal-nfe.exemplo.com"
                    />
                  </div>
                  <AnimatePresence>
                    {errors.invoice_portal_url && touched.invoice_portal_url && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.invoice_portal_url}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

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
                placeholder="Observações importantes sobre o cliente, preferências, acordos especiais..."
              />
            </div>

          </form>
        </ScrollArea>

        <DialogFooter className="p-4 sm:p-6 border-t border-slate-800 flex-shrink-0 bg-slate-900/50 pb-safe">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:w-auto bg-transparent border-slate-700 hover:bg-slate-800 h-12 min-h-[44px] order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white h-12 min-h-[44px] order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  {client ? 'Atualizar Cliente' : 'Criar Cliente'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}