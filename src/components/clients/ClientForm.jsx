import {
  useState,
  useEffect,
  useRef
} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Building2, User, DollarSign, X, AlertCircle, Phone, Mail, FileText, Camera, ImagePlus } from 'lucide-react';
import appToast from '@/lib/appToast';

import { useAuth } from '@/lib/authContext';
import { useClients } from '@/lib/useClients';
import { useCompanies } from '@/lib/useCompanies';
import { buildCompanyNotes } from '@/lib/cnpjSearch';
import { uploadUserFile } from '@/lib/uploadFile';
import { motion, AnimatePresence } from 'framer-motion';
import ColorGridPicker from '@/components/ui/ColorGridPicker';
import { pickDefaultClientColor, DEFAULT_CLIENT_COLOR } from '@/lib/brandColors';
import CompanySearchInput from './CompanySearchInput';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

export default function ClientForm({ client, onSuccess, onCancel }) {
  const { user } = useAuth();
  const theme = useCategoryTheme();
  const { create: createClient, update: updateClient } = useClients();
  const { upsertCompany } = useCompanies();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    client_type: 'empresa',
    name: '',
    razao_social: '',
    contact_person: '',
    email: '',
    phone: '',
    logo_url: '',
    invoice_portal_url: '',
    notes: '',
    policy_default_payment_model: null,
    policy_allows_meio_e_dobra_juntos: false,
    default_daily_cache: '',
    brand_color: DEFAULT_CLIENT_COLOR,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        client_type: client.client_type || 'empresa',
        name: client.name || '',
        razao_social: '',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        logo_url: client.logo_url || '',
        invoice_portal_url: client.invoice_portal_url || '',
        notes: client.notes || '',
        policy_default_payment_model: client.policy_default_payment_model || null,
        policy_allows_meio_e_dobra_juntos: client.policy_allows_meio_e_dobra_juntos || false,
        default_daily_cache: client.default_daily_cache > 0 ? String(client.default_daily_cache) : '',
        brand_color: client.brand_color || DEFAULT_CLIENT_COLOR,
      });
    } else {
      setFormData({
        client_type: 'empresa',
        name: '',
        razao_social: '',
        contact_person: '',
        email: '',
        phone: '',
        logo_url: '',
        invoice_portal_url: '',
        notes: '',
        policy_default_payment_model: null,
        policy_allows_meio_e_dobra_juntos: false,
        default_daily_cache: '',
        brand_color: DEFAULT_CLIENT_COLOR,
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

  const handleCompanySelect = (company) => {
    if (!company) {
      setSelectedCompany(null);
      return;
    }
    setSelectedCompany(company);

    // Nome fantasia = nome de exibição; razão social = nome jurídico
    const nomeFantasia = company.trading_name || company.name || '';
    const razaoSocial  = company.razao_social && company.razao_social !== nomeFantasia
      ? company.razao_social
      : '';
    const autoNotes = buildCompanyNotes(company);
    const clearbitLogo = company.domain ? `https://logo.clearbit.com/${company.domain}` : null;

    setFormData(prev => ({
      ...prev,
      name: nomeFantasia || prev.name,
      razao_social: razaoSocial || prev.razao_social,
      email: company.email || prev.email,
      phone: company.phone || prev.phone,
      contact_person: company.contact_person || prev.contact_person,
      logo_url: prev.logo_url || clearbitLogo || '',
      notes: autoNotes
        ? (prev.notes ? `${autoNotes}\n\n${prev.notes}` : autoNotes)
        : prev.notes,
    }));

    if (nomeFantasia) setErrors(prev => { const e = { ...prev }; delete e.name; return e; });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await uploadUserFile(file, { folder: 'logos' });
      handleChange('logo_url', file_url);
      appToast.success('Logo enviada com sucesso!');
    } catch (err) {
      appToast.error('Erro ao enviar logo', { description: err.message });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campo obrigatório
    setTouched({ name: true });
    if (!validateField('name', formData.name)) {
      appToast.error('Por favor, preencha o nome do cliente');
      return;
    }

    // Validar outros campos se preenchidos
    const fieldsToValidate = ['email', 'phone', 'invoice_portal_url'];
    let isValid = true;
    fieldsToValidate.forEach(field => {
      if (formData[field] && !validateField(field, formData[field])) {
        isValid = false;
      }
    });

    if (!isValid) {
      appToast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      if (!user?.id) {
        appToast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      // Salva empresa no banco compartilhado se selecionada via busca
      let companyId = null;
      if (selectedCompany && !client?.id) {
        try {
          const saved = await upsertCompany(selectedCompany);
          companyId = saved?.id || null;
        } catch (e) {
          console.warn('Não foi possível salvar empresa no banco compartilhado:', e.message);
        }
      }

      // Prepend razão social to notes if filled and not already present
      let notesValue = formData.notes || null;
      if (formData.razao_social?.trim()) {
        const razaoLine = `Razão Social: ${formData.razao_social.trim()}`;
        if (!notesValue?.includes(razaoLine)) {
          notesValue = notesValue ? `${razaoLine}\n${notesValue}` : razaoLine;
        }
      }

      const clientData = {
        client_type: formData.client_type || 'empresa',
        name: formData.name.trim(),
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        logo_url: formData.logo_url || null,
        invoice_portal_url: formData.invoice_portal_url || null,
        notes: notesValue,
        policy_default_payment_model: formData.policy_default_payment_model || null,
        policy_allows_meio_e_dobra_juntos: formData.policy_allows_meio_e_dobra_juntos || false,
        default_daily_cache: formData.default_daily_cache === ''
          ? 0
          : Number(formData.default_daily_cache),
        brand_color: formData.brand_color || pickDefaultClientColor(formData.name),
        ...(companyId ? { company_id: companyId } : {}),
      };

      let result;
      if (client?.id) {
        result = await updateClient(client.id, clientData);
        appToast.success('Cliente atualizado com sucesso!');
      } else {
        result = await createClient(clientData);
        appToast.success('Cliente criado com sucesso!');
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      const missingBrandColor = /brand_color/i.test(error?.message || '');
      if (missingBrandColor && client?.id) {
        try {
          const { brand_color: _bc, ...withoutColor } = {
            name: formData.name.trim(),
            contact_person: formData.contact_person || null,
            email: formData.email || null,
            phone: formData.phone || null,
            logo_url: formData.logo_url || null,
            invoice_portal_url: formData.invoice_portal_url || null,
            notes: formData.notes || null,
            policy_default_payment_model: formData.policy_default_payment_model || null,
            policy_allows_meio_e_dobra_juntos: formData.policy_allows_meio_e_dobra_juntos || false,
            default_daily_cache: formData.default_daily_cache === '' ? 0 : Number(formData.default_daily_cache),
          };
          const result = await updateClient(client.id, withoutColor);
          appToast.success('Cliente atualizado (cor será salva após atualização do banco).');
          onSuccess?.(result);
          return;
        } catch { /* fall through */ }
      }
      appToast.error('Erro ao salvar cliente.', {
        description: error?.message || 'Ocorreu um problema. Por favor, tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent hideDefaultClose className="sm:max-w-2xl h-[95dvh] max-h-[95dvh] bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              {formData.client_type === 'pessoa'
                ? <User className="w-5 h-5 text-purple-400 flex-shrink-0" />
                : <Building2 className="w-5 h-5 flex-shrink-0" style={{ color: theme.primaryHex }} />
              }
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

        <ScrollArea fill>
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 pb-safe">

            {/* Toggle Empresa / Pessoa */}
            <div className="flex rounded-xl overflow-hidden border border-slate-700">
              <button
                type="button"
                onClick={() => handleChange('client_type', 'empresa')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                  formData.client_type === 'empresa'
                    ? 'text-white'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
                style={formData.client_type === 'empresa' ? theme.primaryStyle : undefined}
              >
                <Building2 className="w-4 h-4" />
                Empresa
              </button>
              <button
                type="button"
                onClick={() => handleChange('client_type', 'pessoa')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                  formData.client_type === 'pessoa'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                Pessoa
              </button>
            </div>

            {/* Busca inteligente de empresa (só para empresas) */}
            {!client && formData.client_type === 'empresa' && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                <CompanySearchInput
                  onSelect={handleCompanySelect}
                  disabled={loading}
                />
                <p className="text-[10px] text-slate-600 font-mono leading-relaxed">
                  Busca no banco do Backstage Pro e na Receita Federal.
                  Encontrou? Clique para preencher tudo automaticamente.
                  Ou preencha manualmente abaixo.
                </p>
              </div>
            )}

            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-white flex items-center gap-2">
                {formData.client_type === 'pessoa'
                  ? <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                  : <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={theme.accentStyle} />
                }
                Informações Básicas
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300 text-sm font-medium">
                  {formData.client_type === 'pessoa' ? 'Nome completo *' : 'Nome do Cliente / Nome Fantasia *'}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation ${
                    errors.name && touched.name ? 'border-red-500' : ''
                  }`}
                  placeholder={formData.client_type === 'pessoa' ? 'Ex: João Silva' : 'Ex: Amarrok Produções'}
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

              {formData.client_type === 'empresa' && (
                <div className="space-y-2">
                  <Label htmlFor="razao_social" className="text-slate-300 text-sm font-medium">
                    Razão Social
                    <span className="ml-1.5 text-[10px] text-slate-600 font-normal normal-case">Nome jurídico na NF</span>
                  </Label>
                  <Input
                    id="razao_social"
                    value={formData.razao_social}
                    onChange={(e) => handleChange('razao_social', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation"
                    placeholder="Ex: AMARROK PRODUCOES E SERVICOS LTDA"
                    maxLength={150}
                  />
                </div>
              )}

              <ColorGridPicker
                value={formData.brand_color}
                onChange={(hex) => handleChange('brand_color', hex)}
              />

              <div className="space-y-2">
                <Label htmlFor="contact_person" className="text-slate-300 text-sm font-medium">
                  {formData.client_type === 'pessoa' ? 'Empresa / Produtora' : 'Pessoa de Contato'}
                </Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation"
                  placeholder={formData.client_type === 'pessoa' ? 'Ex: Amarrok Produções' : 'Ex: João Silva'}
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

              <div className="space-y-2">
                <Label htmlFor="default_daily_cache" className="text-slate-300 text-sm font-medium">
                  Cachê diário padrão (R$)
                </Label>
                <p className="text-xs text-slate-500">
                  Preenchido automaticamente ao criar eventos para este cliente.
                </p>
                <Input
                  id="default_daily_cache"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.default_daily_cache}
                  onChange={(e) => handleChange('default_daily_cache', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-12 text-base touch-manipulation"
                  placeholder="Ex: 800"
                />
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
                      Permite aplicar &ldquo;Meio Cachê&rdquo; e &ldquo;Dobra&rdquo; simultaneamente em um único evento.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* URLs */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm font-medium">
                    Logo do Cliente
                  </Label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="flex items-center gap-3">
                    {formData.logo_url ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-800">
                        <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                        <button
                          type="button"
                          onClick={() => handleChange('logo_url', '')}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-slate-900/80 flex items-center justify-center hover:bg-red-900/80 transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center flex-shrink-0 bg-slate-800/50"
                      >
                        <ImagePlus className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="w-full h-10 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 text-sm"
                      >
                        {uploadingLogo ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                        ) : (
                          <><Camera className="w-4 h-4 mr-2" /> {formData.logo_url ? 'Trocar logo' : 'Enviar logo'}</>
                        )}
                      </Button>
                      <p className="text-xs text-slate-500">PNG, JPG ou SVG • máx. 5MB</p>
                    </div>
                  </div>
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
              type="button"
              onClick={handleSubmit}
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full sm:w-auto text-white h-12 min-h-[44px] order-1 sm:order-2 border-0 hover:brightness-110 active:brightness-95 transition-[filter]"
              style={theme.primaryStyle}
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