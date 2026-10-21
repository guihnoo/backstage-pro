import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

export default function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel, destructive = false }) {
  const theme = useCategoryTheme();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#161616] border-[#2a2a2a] text-white max-w-sm mx-4 bp-focus-scope">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-[#a0a8b8]">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-transparent border-[#2a2a2a] text-[#c8c8c8] hover:bg-[#1f1f1f] hover:text-white"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              destructive
                ? 'bg-[#ff2e88] hover:bg-[#ff4d9c] text-[#0a0a0a] border-0'
                : 'text-white border-0 hover:brightness-110 active:brightness-95 transition-[filter]'
            }
            style={destructive ? undefined : theme.primaryStyle}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
