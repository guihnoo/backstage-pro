import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import appToast from '@/lib/appToast';

const WORD = 'EXCLUIR';

/**
 * Excluir minha conta: apaga tudo no servidor (função delete-account) e sai do app.
 * Pede para digitar EXCLUIR — não tem volta.
 */
export default function DeleteAccountDialog({ open, onOpenChange, onDeleted }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const ready = typed.trim().toUpperCase() === WORD;

  const close = (next) => {
    if (deleting) return;
    if (!next) setTyped('');
    onOpenChange(next);
  };

  const handleDelete = async () => {
    if (!ready) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirm: WORD } });
    setDeleting(false);
    if (error || !data?.success) {
      appToast.error('Não deu para excluir a conta', { description: data?.error || 'Confira a internet e tente de novo.' });
      return;
    }
    appToast.success('Conta excluída. Seus dados foram apagados.');
    onDeleted?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={close}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir minha conta?</AlertDialogTitle>
          <AlertDialogDescription>
            Apaga para sempre seus shows, clientes, despesas, horas, fotos e recibos, e desliga o Google Agenda.
            Se quiser guardar uma cópia, use “Baixar meus dados” antes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label htmlFor="delete-account-confirm" className="block font-tag text-[10px] tracking-[1px] uppercase text-[#a8a8a8]">
            Digite {WORD} para confirmar
          </label>
          <input
            id="delete-account-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            className="w-full h-12 bg-[#0a0a0a] border border-[#333333] rounded-[12px] px-4 text-base font-semibold text-white focus:outline-none focus:border-[#ff2e88]"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => close(false)}
            disabled={deleting}
            className="flex-1 h-11 rounded-full border border-[#444444] text-white text-sm font-extrabold disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!ready || deleting}
            className="flex-1 h-11 rounded-full bg-[#ff2e88] text-[#0a0a0a] text-sm font-extrabold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Excluir para sempre
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
