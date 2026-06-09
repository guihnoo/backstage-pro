import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { hardNavigate } from '@/lib/hardNavigate';

const ClientRow = ({ client, onClientClick, onEdit, onDelete }) => {
    // Função para parar a propagação do evento, evitando que o modal abra ao clicar no menu
    const handleMenuClick = (e) => {
        e.stopPropagation();
    };

    return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center p-3 bg-slate-800/40 rounded-lg hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
          onClick={() => onClientClick(client)} // Toda a linha é clicável
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {client.logo_url ? (
                    <img src={client.logo_url} alt={client.name} className="w-10 h-10 rounded-md object-contain bg-white/10 p-1 flex-shrink-0" />
                ) : (
                    <div className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-slate-300">{client.name.charAt(0)}</span>
                    </div>
                )}
                <div className="min-w-0">
                    <p className="font-semibold text-white">{client.name}</p> {/* NOME COMPLETO */}
                    <p className="text-sm text-slate-400 truncate">{client.contact_person || 'Sem contato principal'}</p>
                </div>
            </div>
            <div className="hidden md:block flex-1 min-w-0 px-4">
                 <p className="text-sm text-slate-400 truncate">{client.notes || 'Sem observações'}</p>
            </div>
            <div className="flex items-center gap-2 ml-4" onClick={handleMenuClick}> {/* Parar propagação aqui */}
                {/* Botão "Detalhes" foi removido */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-white">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); hardNavigate(`/client-detail?id=${client.id}`); }} className="focus:bg-slate-800">
                            <ExternalLink className="w-4 h-4 mr-2 text-cyan-400" />
                            Ver Página
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(client); }} className="focus:bg-slate-800">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(client.id); }} className="text-red-400 focus:bg-red-900/50 focus:text-red-300">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
};

export default function ClientListTableView({ clients, onClientClick, onEdit, onDelete }) {
  return (
    <div className="space-y-2">
        <div className="hidden md:flex items-center px-3 py-2 text-xs font-medium text-slate-400">
            <div className="flex-1">CLIENTE</div>
            <div className="flex-1">OBSERVAÇÕES</div>
            <div className="w-24 text-right">AÇÕES</div>
        </div>
        {clients.map((client) => (
            <ClientRow 
                key={client.id} 
                client={client} 
                onClientClick={onClientClick} 
                onEdit={onEdit} 
                onDelete={onDelete} 
            />
        ))}
    </div>
  );
}