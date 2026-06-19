import { useState, useRef } from 'react';
import { Upload, FileText, Download, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useEvents } from '@/lib/useEvents';
import { toast } from 'sonner';

const BUCKET = 'backstage';
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPT = 'application/pdf,application/xml,text/xml,.pdf,.xml';

function extractStoragePath(publicUrl) {
  try {
    return publicUrl.split(`/storage/v1/object/public/${BUCKET}/`)[1] ?? null;
  } catch {
    return null;
  }
}

export default function NFeAttachment({ event }) {
  const { update: updateEvent } = useEvents();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [numero, setNumero] = useState(event?.nfe_numero ?? '');
  const [savingNumero, setSavingNumero] = useState(false);

  const hasArquivo = Boolean(event?.nfe_arquivo_url);
  const hasNFe = hasArquivo || Boolean(event?.nfe_numero);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validTypes = ['application/pdf', 'application/xml', 'text/xml'];
    const validExt = /\.(pdf|xml)$/i.test(file.name);
    if (!validTypes.includes(file.type) && !validExt) {
      toast.error('Envie apenas PDF ou XML da NF-e.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Arquivo muito grande. Máximo 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) throw new Error('Não autenticado.');

      // Remove arquivo anterior se existir
      if (event.nfe_arquivo_url) {
        const oldPath = extractStoragePath(event.nfe_arquivo_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
      const path = `${userId}/nfe/${event.id}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

      await updateEvent(event.id, {
        nfe_arquivo_url: urlData.publicUrl,
        nfe_arquivo_nome: file.name,
        nfe_numero: numero.trim() || event.nfe_numero || null,
      });

      toast.success('NF-e anexada ao evento!');
    } catch (err) {
      toast.error(`Erro ao anexar: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveNumero() {
    if (!numero.trim()) return;
    setSavingNumero(true);
    try {
      await updateEvent(event.id, { nfe_numero: numero.trim() });
      toast.success('Número da NF-e salvo.');
    } catch {
      toast.error('Erro ao salvar número.');
    } finally {
      setSavingNumero(false);
    }
  }

  async function handleDelete() {
    try {
      if (event.nfe_arquivo_url) {
        const oldPath = extractStoragePath(event.nfe_arquivo_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      await updateEvent(event.id, {
        nfe_arquivo_url: null,
        nfe_arquivo_nome: null,
        nfe_numero: null,
      });
      setNumero('');
      toast.success('NF-e removida do evento.');
    } catch {
      toast.error('Erro ao remover NF-e.');
    }
  }

  // ── NF-e já registrada ────────────────────────────────────────────────────
  if (hasNFe) {
    return (
      <div className="bg-blue-950/20 border border-blue-700/30 rounded-lg p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              {event.nfe_numero && (
                <p className="text-xs font-semibold text-white">NF-e nº {event.nfe_numero}</p>
              )}
              {event.nfe_arquivo_nome && (
                <p className="text-xs text-slate-400 truncate">{event.nfe_arquivo_nome}</p>
              )}
              {!event.nfe_arquivo_url && !event.nfe_arquivo_nome && (
                <p className="text-xs text-slate-400">Número registrado — sem arquivo</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {hasArquivo && (
              <a
                href={event.nfe_arquivo_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Baixar NF-e"
              >
                <Button type="button" size="sm" variant="outline"
                  className="h-7 w-7 p-0 border-slate-600 text-slate-300 hover:bg-slate-700">
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              title="Substituir arquivo"
              className="h-7 w-7 p-0 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {uploading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Upload className="w-3.5 h-3.5" />
              }
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDelete}
              title="Remover NF-e"
              className="h-7 w-7 p-0 border-red-800/50 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  // ── Sem NF-e — formulário para registrar ─────────────────────────────────
  return (
    <div className="border border-dashed border-blue-800/40 rounded-lg p-3 space-y-2.5 bg-blue-950/10">
      <p className="text-xs text-slate-400 font-medium">Registrar NF-e emitida</p>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Número da NF-e (ex: 000042)"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveNumero()}
          className="h-8 text-sm bg-slate-800/80 border-slate-700 flex-1"
        />
        {numero.trim() && numero.trim() !== (event?.nfe_numero ?? '') && (
          <Button
            type="button"
            size="sm"
            disabled={savingNumero}
            onClick={handleSaveNumero}
            className="h-8 px-3 text-xs bg-blue-700 hover:bg-blue-600 text-white flex-shrink-0"
          >
            {savingNumero ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-8 text-xs border-blue-700/40 text-blue-300 hover:bg-blue-900/20"
        >
          {uploading
            ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Enviando...</>
            : <><Upload className="w-3 h-3 mr-1.5" />Anexar PDF ou XML</>
          }
        </Button>
        <a
          href="https://www.nfse.gov.br/EmissorNacional/Login"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs border-slate-600 text-slate-400 hover:bg-slate-700"
            title="Abrir portal NFS-e Nacional"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </a>
      </div>

      <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileChange} />
    </div>
  );
}
