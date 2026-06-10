import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Plus, Building2, User } from 'lucide-react';
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
import ClientQuickCreateDialog from './ClientQuickCreateDialog';

export default function ClientCombobox({
  clients = [],
  value,
  onChange,
  onCreateClient,
  disabled = false,
  placeholder = 'Buscar cliente ou criar novo...',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingName, setPendingName] = useState('');

  const selected = useMemo(() => clients.find((c) => c.id === value), [clients, value]);

  const trimmedQuery = query.trim();
  const showCreate =
    trimmedQuery.length >= 1 &&
    !clients.some((c) => c.name.toLowerCase() === trimmedQuery.toLowerCase());

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

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-slate-800 border-slate-700 text-left font-normal h-11"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selected.brand_color || '#A64AFF' }}
              />
              {selected.client_type === 'pessoa'
                ? <User className="w-3 h-3 text-purple-400 flex-shrink-0" />
                : null
              }
              <span className="truncate">{selected.name}</span>
              {selected.profile_complete === false && (
                <span className="text-[10px] text-amber-400 border border-amber-500/40 rounded px-1">rascunho</span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-slate-900 border-slate-700" align="start">
        <Command shouldFilter>
          <CommandInput
            placeholder="Digite o nome para buscar ou criar..."
            value={query}
            onValueChange={setQuery}
            className="text-white"
          />
          <CommandList>
            <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="text-slate-200"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: client.brand_color || '#A64AFF' }}
                  />
                  {client.client_type === 'pessoa'
                    ? <User className="w-3.5 h-3.5 text-purple-400 mr-1 flex-shrink-0" />
                    : <Building2 className="w-3.5 h-3.5 text-slate-500 mr-1 flex-shrink-0" />
                  }
                  <span className="flex-1 truncate">{client.name}</span>
                  {client.profile_complete === false && (
                    <span className="text-[10px] text-amber-400 ml-1">rascunho</span>
                  )}
                  <Check className={cn('ml-auto h-4 w-4', value === client.id ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
            {showCreate && onCreateClient && (
              <>
                <CommandSeparator className="bg-slate-700" />
                <CommandGroup>
                  <CommandItem
                    value={`criar-${trimmedQuery}`}
                    onSelect={handleOpenQuickCreate}
                    className="text-cyan-300"
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
