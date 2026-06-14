import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, Loader2, CheckCircle2 } from 'lucide-react';
import appToast from '@/lib/appToast';
import CompanySearchInput from './CompanySearchInput';
import { buildCompanyNotes } from '@/lib/cnpjSearch';
import { pickDefaultClientColor } from '@/lib/brandColors';
import { useCompanies } from '@/lib/useCompanies';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

export default function ClientQuickCreateDialog({ open, onOpenChange, initialName = '', onCreateClient, onCreated }) {
  const { upsertCompany } = useCompanies();
  const { primaryHex } = useCategoryTheme();
  const [clientType, setClientType] = useState('empresa');
  const [name, setName] = useState(initialName);
  const [companyRef, setCompanyRef] = useState(''); // para pessoa: empresa de origem
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleOpenChange = (val) => {
    if (!val) {
      setSelectedCompany(null);
      setName(initialName);
      setCompanyRef('');
      setClientType('empresa');
    }
    onOpenChange(val);
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company || null);
    if (company) {
      const displayName = company.trading_name || company.name || '';
      if (displayName) setName(displayName);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      let companyId = null;
      if (clientType === 'empresa' && selectedCompany) {
        try {
          const saved = await upsertCompany(selectedCompany);
          companyId = saved?.id || null;
        } catch (err) {
          console.warn('Empresa não salva no banco compartilhado:', err.message);
        }
      }

      const razaoSocial =
        clientType === 'empresa' &&
        selectedCompany?.razao_social &&
        selectedCompany.razao_social !== trimmed
          ? selectedCompany.razao_social
          : '';

      let notes = clientType === 'empresa' && selectedCompany ? buildCompanyNotes(selectedCompany) : '';
      if (razaoSocial) {
        const line = `Razão Social: ${razaoSocial}`;
        notes = notes ? `${line}\n${notes}` : line;
      }
      if (clientType === 'pessoa' && companyRef.trim()) {
        const line = `Empresa: ${companyRef.trim()}`;
        notes = notes ? `${line}\n${notes}` : line;
      }

      const clientData = {
        client_type: clientType,
        name: trimmed,
        brand_color: pickDefaultClientColor(trimmed),
        profile_complete: clientType === 'empresa' ? !!selectedCompany : true,
        ...(clientType === 'pessoa' && companyRef.trim() && { contact_person: companyRef.trim() }),
        ...(clientType === 'empresa' && selectedCompany?.email && { email: selectedCompany.email }),
        ...(clientType === 'empresa' && selectedCompany?.phone && { phone: selectedCompany.phone }),
        ...(notes && { notes }),
        ...(companyId && { company_id: companyId }),
      };

      const created = await onCreateClient(clientData);
      if (created?.id) {
        onCreated(created.id);
        handleOpenChange(false);
      }
    } catch (error) {
      appToast.error('Não foi possível criar o cliente.', {
        description: error?.message || 'Tente novamente ou cadastre em Clientes.',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white z-[106]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {clientType === 'pessoa'
              ? <><User className="w-4 h-4 text-purple-400" /><span className="text-purple-300">Nova Pessoa</span></>
              : <><Building2 className="w-4 h-4" style={{ color: primaryHex }} /><span style={{ color: primaryHex }}>Nova Empresa</span></>
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Toggle Empresa / Pessoa */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700">
            <button
              type="button"
              onClick={() => { setClientType('empresa'); setSelectedCompany(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                clientType === 'empresa' ? 'text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
              style={clientType === 'empresa' ? { backgroundColor: primaryHex } : undefined}
            >
              <Building2 className="w-4 h-4" />
              Empresa
            </button>
            <button
              type="button"
              onClick={() => { setClientType('pessoa'); setSelectedCompany(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                clientType === 'pessoa' ? 'bg-purple-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              Pessoa
            </button>
          </div>

          {/* Busca inteligente (só para empresa) */}
          {clientType === 'empresa' && (
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <CompanySearchInput onSelect={handleCompanySelect} />
              <p className="text-[10px] text-slate-600 font-mono leading-relaxed">
                Busca na Receita Federal pelo nome ou CNPJ.
                Encontrou? Clique para preencher automaticamente.
              </p>
            </div>
          )}

          {/* Prévia dos dados da empresa */}
          {clientType === 'empresa' && selectedCompany && (
            <div
              className="rounded-lg border p-3 space-y-1"
              style={{ borderColor: `${primaryHex}4d`, backgroundColor: `${primaryHex}14` }}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: primaryHex }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dados encontrados
              </div>
              {selectedCompany.razao_social && selectedCompany.razao_social !== name && (
                <p className="text-[11px] text-slate-300">Razão Social: <span className="text-white">{selectedCompany.razao_social}</span></p>
              )}
              {selectedCompany.email && (
                <p className="text-[11px] text-slate-300">Email: <span className="text-white">{selectedCompany.email}</span></p>
              )}
              {selectedCompany.city && (
                <p className="text-[11px] text-slate-300">Cidade: <span className="text-white">{selectedCompany.city}{selectedCompany.state ? ` / ${selectedCompany.state}` : ''}</span></p>
              )}
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="qc-name" className="text-slate-300 text-sm">
              {clientType === 'pessoa' ? 'Nome completo' : 'Nome Fantasia'}
            </Label>
            <Input
              id="qc-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={clientType === 'pessoa' ? 'Ex: João Silva' : 'Ex: Amarrok Comunicação'}
              className="bg-slate-800 border-slate-700 text-white h-11"
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Empresa de origem (só para pessoa) */}
          {clientType === 'pessoa' && (
            <div className="space-y-1.5">
              <Label htmlFor="qc-company" className="text-slate-300 text-sm">
                Empresa / Produtora
                <span className="ml-1.5 text-[10px] text-slate-500 font-normal">opcional</span>
              </Label>
              <Input
                id="qc-company"
                value={companyRef}
                onChange={e => setCompanyRef(e.target.value)}
                placeholder="Ex: Amarrok Produções"
                className="bg-slate-800 border-slate-700 text-white h-11"
                autoComplete="off"
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-slate-700"
              onClick={() => handleOpenChange(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${clientType === 'pessoa' ? 'bg-purple-600 hover:bg-purple-500' : 'text-white hover:opacity-90'}`}
              style={clientType === 'empresa' ? { backgroundColor: primaryHex } : undefined}
              disabled={!name.trim() || creating}
            >
              {creating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : clientType === 'pessoa' ? 'Criar Pessoa' : 'Criar Empresa'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
