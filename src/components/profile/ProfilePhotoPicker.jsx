import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, FolderOpen, Trash2, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { uploadUserFile } from '@/lib/uploadFile';
import { squareThumbnail } from '@/lib/imageResize';
import appToast from '@/lib/appToast';

/**
 * Foto do perfil: o usuário escolhe tirar na hora (câmera), pegar da galeria ou procurar um arquivo.
 * A foto é cortada em quadrado e reduzida antes do envio — foto de celular não bate mais no limite de 5 MB.
 */
export default function ProfilePhotoPicker({ open, onOpenChange, hasPhoto, onUploaded, onRemove }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const small = await squareThumbnail(file);
      const { file_url } = await uploadUserFile(small, { folder: 'avatars' });
      await onUploaded(file_url);
      appToast.success('Foto de perfil atualizada!');
      onOpenChange(false);
    } catch (err) {
      appToast.error('Não deu para usar essa foto', { description: err.message });
    } finally {
      setBusy(false);
      input.value = '';
    }
  };

  const options = [
    { key: 'camera', icon: Camera, title: 'Tirar uma foto agora', hint: 'Abre a câmera do celular', ref: cameraRef },
    { key: 'gallery', icon: ImageIcon, title: 'Escolher da galeria', hint: 'Fotos que já estão no aparelho', ref: galleryRef },
    { key: 'file', icon: FolderOpen, title: 'Escolher um arquivo', hint: 'JPG, PNG ou WebP no aparelho ou no computador', ref: fileRef },
  ];

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <SheetContent side="bottom" className="bg-[#121212] border-t-2 border-t-[#ffd400] rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <SheetHeader className="text-left">
          <SheetTitle>Foto do perfil</SheetTitle>
          <SheetDescription>Aparece no seu crew pass. Ela é cortada em quadrado e reduzida sozinha.</SheetDescription>
        </SheetHeader>

        {/* câmera: capture="user" abre a câmera frontal; galeria e arquivo abrem o seletor */}
        <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={handleFile} />

        <div className="mt-4 space-y-2">
          {options.map(({ key, icon: Icon, title, hint, ref }) => (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => ref.current?.click()}
              className="w-full flex items-center gap-3 h-16 px-4 rounded-[14px] bg-[#0a0a0a] border border-[#222222] text-left hover:border-[#444444] disabled:opacity-60"
            >
              <span className="w-10 h-10 rounded-full bg-[#ffd400] text-[#0a0a0a] flex items-center justify-center shrink-0">
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-white">{title}</span>
                <span className="block text-[11px] text-[#a8a8a8] truncate">{hint}</span>
              </span>
            </button>
          ))}
          {hasPhoto && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => { await onRemove(); onOpenChange(false); }}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-full border border-[#ff2e88]/60 text-[#ff2e88] text-sm font-bold disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" /> Remover foto
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
