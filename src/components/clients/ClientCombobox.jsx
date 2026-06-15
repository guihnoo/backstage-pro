import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getOpenDialogElement } from '@/lib/portalContainer';
import { Check, ChevronsUpDown, Plus, Building2, User, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { AUTH_HERO_PRIMARY } from '@/lib/categoryGear';
import ClientQuickCreateDialog from './ClientQuickCreateDialog';
import CompanyAvatar from './CompanyAvatar';
import { useCategoryTheme } from '@/lib/useCategoryTheme';
import { useCompanies } from '@/lib/useCompanies';
import {
  clientDataFromCompany,
  getCompanyDisplayName,
  normalizeCompanyKey,
} from '@/lib/companyEnrichment';

export default function ClientCombobox({
  clients = [],
  value,
  onChange,
  onCreateClient,
  onQuickCreateOpenChange,
  disabled = false,
  placeholder = 'Buscar cliente ou criar novo...',
}) {
  const { primaryHex } = useCategoryTheme();
  const { searchLocal } = useCompanies();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [portalContainer, setPortalContainer] = useState(undefined);
  const [companyResults, setCompanyResults] = useState([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const searchAbort = useRef(0);

  useLayoutEffect(() => {
    if (!open) {
      setPortalContainer(undefined);
      return;
    }
    setPortalContainer(getOpenDialogElement() || undefined);
  }, [open]);

  useEffect(() => {
    onQuickCreateOpenChange?.(dialogOpen);
  }, [dialogOpen, onQuickCreateOpenChange]);

  const trimmedQuery = query.trim();
  const queryKey = normalizeCompanyKey(trimmedQuery);

  useEffect(() => {
    if (!open || trimmedQuery.length < 2) {
      setCompanyResults([]);
      setCompanyLoading(false);
      return;
    }

    const ticket = ++searchAbort.current;
    setCompanyLoading(true);
    const timer = setTimeout(async () => {
      try {
        const rows = await searchLocal(trimmedQuery);
        if (ticket !== searchAbort.current) return;
        const myCompanyIds = new Set(clients.map((c) => c.company_id).filter(Boolean));
        setCompanyResults(rows.filter((c) => !myCompanyIds.has(c.id)));
      } catch {
        if (ticket === searchAbort.current) setCompanyResults([]);
      } finally {
        if (ticket === searchAbort.current) setCompanyLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [trimmedQuery, open, searchLocal, clients]);

  const selected = useMemo(() => clients.find((c) => c.id === value), [clients, value]);

  const filteredClients = useMemo(() => {
    if (!trimmedQuery) return clients;
    const q = trimmedQuery.toLowerCase();
    return clients.filter((c) => c.name?.toLowerCase().includes(q));
  }, [clients, trimmedQuery]);

  const companyAlreadyLinked = useMemo(
    () => companyResults.some((c) => {
      const key = normalizeCompanyKey(getCompanyDisplayName(c));
      return clients.some(
        (cl) => cl.company_id === c.id || normalizeCompanyKey(cl.name) === key,
      );
    }),
    [companyResults, clients],
  );

  const showCreate =
    trimmedQuery.length >= 1 &&
    !filteredClients.some((c) => normalizeCompanyKey(c.name) === queryKey) &&
    !companyResults.some((c) => normalizeCompanyKey(getCompanyDisplayName(c)) === queryKey) &&
    !companyAlreadyLinked;

  const handleOpenQuickCreate = () => {
    if (!onCreateClient || !trimmedQuery) return;
    setPendingName(trimmedQuery);
    setOpen(false);
    setDialogOpen(true);
  };

  const handleDialogCreated = (clientId) => {
    onChange(clientId);
    setQuery('');
    setDialogOpen(false);
  };

  const handleSelectCompany = async (company) => {
    const existing = clients.find((c) => c.company_id === company.id);
    if (existing) {
      onChange(existing.id);
      setOpen(false);
      setQuery('');
      return;
    }

    if (!onCreateClient) return;
    setLinking(true);
    try {
      const created = await onCreateClient(clientDataFromCompany(company));
      if (created?.id) {
        onChange(created.id);
        setQuery('');
        setOpen(false);
      }
    } finally {
      setLinking(false);
    }
  };

  const listEmpty =
    trimmedQuery.length >= 2 &&
    !companyLoading &&
    !linking &&
    filteredClients.length === 0 &&
    companyResults.length === 0;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || linking}
            className="w-full justify-between bg-slate-800 border-slate-700 text-left font-normal h-11"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                <CompanyAvatar name={selected.name} logoUrl={selected.logo_url} size="sm" />
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selected.brand_color || AUTH_HERO_PRIMARY }}
                />
                {selected.client_type === 'pessoa'
                  ? <User className="w-3 h-3 bp-text-primary flex-shrink-0" />
                  : null}
                <span className="truncate">{selected.name}</span>
                {selected.profile_complete === false && (
                  <span className="text-[10px] text-amber-400 border border-amber-500/40 rounded px-1">rascunho</span>
                )}
              </span>
            ) : (
              <span className="text-slate-400">{linking ? 'Vinculando empresa…' : placeholder}</span>
            )}
            {linking ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-70" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          container={portalContainer}
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-slate-900 border-slate-700"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Digite o nome para buscar ou criar..."
              value={query}
              onValueChange={setQuery}
              className="text-white"
            />
            <CommandList>
              {listEmpty && <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>}

              {filteredClients.length > 0 && (
                <CommandGroup heading="Meus clientes">
                  {filteredClients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={client.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onSelect={() => {
                        onChange(client.id);
                        setOpen(false);
                        setQuery('');
                      }}
                      className="text-slate-200 cursor-pointer"
                    >
                      <CompanyAvatar name={client.name} logoUrl={client.logo_url} size="sm" />
                      <span
                        className="w-2 h-2 rounded-full ml-2 flex-shrink-0"
                        style={{ backgroundColor: client.brand_color || AUTH_HERO_PRIMARY }}
                      />
                      {client.client_type === 'pessoa'
                        ? <User className="w-3.5 h-3.5 bp-text-primary mx-1 flex-shrink-0" />
                        : <Building2 className="w-3.5 h-3.5 text-slate-500 mx-1 flex-shrink-0" />}
                      <span className="flex-1 truncate">{client.name}</span>
                      {client.profile_complete === false && (
                        <span className="text-[10px] text-amber-400 ml-1">rascunho</span>
                      )}
                      <Check className={cn('ml-auto h-4 w-4', value === client.id ? 'opacity-100' : 'opacity-0')} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {(companyLoading || linking) && trimmedQuery.length >= 2 && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Buscando empresas no Backstage Pro…
                </div>
              )}

              {companyResults.length > 0 && (
                <CommandGroup
                  heading={
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Empresas no Backstage Pro
                    </span>
                  }
                >
                  {companyResults.map((company) => {
                    const label = getCompanyDisplayName(company);
                    const location = [company.city, company.state].filter(Boolean).join(' / ');
                    return (
                      <CommandItem
                        key={company.id}
                        value={company.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onSelect={() => handleSelectCompany(company)}
                        className="text-slate-200 cursor-pointer items-start py-2"
                      >
                        <CompanyAvatar company={company} name={label} size="sm" />
                        <div className="flex-1 min-w-0 ml-2">
                          <p className="text-sm truncate">{label}</p>
                          {location && (
                            <p className="text-[10px] text-slate-500 truncate">{location}</p>
                          )}
                          <p className="text-[10px] text-slate-600">Usar cadastro compartilhado · ajuste seus dados depois</p>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-1" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {showCreate && onCreateClient && (
                <>
                  <CommandSeparator className="bg-slate-700" />
                  <CommandGroup>
                    <CommandItem
                      value={`criar-${trimmedQuery}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onSelect={handleOpenQuickCreate}
                      className="cursor-pointer"
                      style={{ color: primaryHex }}
                    >
                      <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                      {`Criar "${trimmedQuery}"`}
                      <span className="ml-1.5 text-[10px] text-slate-500">empresa ou pessoa</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {onCreateClient && (
        <ClientQuickCreateDialog
          key={pendingName}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initialName={pendingName}
          onCreateClient={onCreateClient}
          onCreated={handleDialogCreated}
        />
      )}
    </>
  );
}
