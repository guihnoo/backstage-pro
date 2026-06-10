import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, CheckCircle2 } from 'lucide-react';
import CompanySearchInput from './CompanySearchInput';
import { buildCompanyNotes } from '@/lib/cnpjSearch';
import { pickDefaultClientColor } from '@/lib/brandColors';
import { useCompanies } from '@/lib/useCompanies';

export default function ClientQuickCreateDialog({ open, onOpenChange, initialName = '', onCreateClient, onCreated }) {
  const { upsertCompany } = useCompanies();
  const [name, setName] = useState(initialName);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleOpenChange = (val) => {
    if (!val) {
      setSelectedCompany(null);
      setName(initialName);
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
      if (selectedCompany) {
        try {
          const saved = await upsertCompany(selectedCompany);
          companyId = saved?.id || null;
        } catch (err) {
          console.warn('Empresa não salva no banco compartilhado:', err.message);
        }
      }

      const razaoSocial =
        selectedCompany?.razao_social && selectedCompany.razao_social !== trimmed
          ? selectedCompany.razao_social
          : '';

      let notes = selectedCompany ? buildCompanyNotes(selectedCompany) : '';
      if (razaoSocial) {
        const line = `Razão Social: ${razaoSocial}`;
        notes = notes ? `${line}\n${notes}` : line;
      }

      const clientData = {
        name: trimmed,
        brand_color: pickDefaultClientColor(trimmed),
        profile_complete: !!selectedCompany,
        ...(razaoSocial && { razao_social: razaoSocial }),
        ...(selectedCompany?.email && { email: selectedCompany.email }),
        ...(selectedCompany?.phone && { phone: selectedCompany.phone }),
        ...(notes && { notes }),
        ...(companyId && { company_id: companyId }),
      };

      const created = await onCreateClient(clientData);
      if (created?.id) {
        onCreated(created.id);
        handleOpenChange(false);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-lg border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-300">
            <Building2 className="w-4 h-4" />
            Nova Empresa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Busca inteligente */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <CompanySearchInput onSelect={handleCompanySelect} />
            <p className="text-[10px] text-slate-600 font-mono leading-relaxed">
              Busca na Receita Federal pelo nome ou CNPJ.
              Encontrou? Clique para preencher automaticamente.
            </p>
          </div>

          {/* Prévia dos dados encontrados */}
          {selectedCompany && (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dados da empresa
              </div>
              {selectedCompany.razao_social && selectedCompany.razao_social !== name && (
                <p className="text-[11px] text-slate-300">Razão Social: <span className="text-white">{selectedCompany.razao_social}</span></p>
              )}
              {selectedCompany.email && (
                <p className="text-[11px] text-slate-300">Email: <span className="text-white">{selectedCompany.email}</span></p>
              )}
              {selectedCompany.phone && (
                <p className="text-[11px] text-slate-300">Telefone: <span className="text-white">{selectedCompany.phone}</span></p>
              )}
              {selectedCompany.city && (
                <p className="text-[11px] text-slate-300">Cidade: <span className="text-white">{selectedCompany.city}{selectedCompany.state ? ` / ${selectedCompany.state}` : ''}</span></p>
              )}
            </div>
          )}

          {/* Nome fantasia */}
          <div className="space-y-1.5">
            <Label htmlFor="qc-name" className="text-slate-300 text-sm">
              Nome Fantasia
            </Label>
            <Input
              id="qc-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Amarrok Comunicação"
              className="bg-slate-800 border-slate-700 text-white h-11"
              autoComplete="off"
            />
          </div>

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
              className="flex-1 bg-cyan-600 hover:bg-cyan-500"
              disabled={!name.trim() || creating}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Empresa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
