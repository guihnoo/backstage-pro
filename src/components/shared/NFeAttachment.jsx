import { useState, useRef } from 'react';
import {
  Upload, FileText, Download, Trash2, Loader2,
  ExternalLink, CheckCircle2, AlertTriangle, XCircle, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useEvents } from '@/lib/useEvents';
import { getEventCacheAmount } from '@/lib/eventFinance';
import { getClientDisplayName } from '@/lib/eventDisplay';
import { toast } from 'sonner';

const BUCKET = 'backstage';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPT = 'application/pdf,.pdf';

function extractStoragePath(publicUrl) {
  try {
    return publicUrl.split(`/storage/v1/object/public/${BUCKET}/`)[1] ?? null;
  } catch {
    return null;
  }
}

// ── Card de resultado da análise IA ──────────────────────────────────────────
function AnaliseCard({ analise, clienteNome }) {
  if (!analise) return null;

  const ok = analise.cliente_reconhecido && analise.valor_confere;
  const divergencias = analise.divergencias ?? [];

  return (
    <div className={`rounded-lg border p-3 space-y-2 text-xs ${
      ok
        ? 'bg-emerald-950/20 border-emerald-700/30'
        : 'bg-amber-950/20 border-amber-700/30'
    }`}>
      {/* Status geral */}
      <div className="flex items-center gap-2">
        {ok
          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        }
        <span className={`font-semibold ${ok ? 'text-emerald-300' : 'text-amber-300'}`}>
          {ok ? 'NF-e verificada pela IA' : 'Atenção — divergências encontradas'}
        </span>
      </div>

      {/* Dados extraídos */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-slate-900/40 rounded px-2.5 py-2">
        {analise.nfe_numero && (
          <>
            <span className="text-slate-400">Número</span>
            <span className="text-white font-mono font-medium">{analise.nfe_numero}</span>
          </>
        )}
        {analise.nfe_tomador_nome && (
          <>
            <span className="text-slate-400">Tomador</span>
            <span className="text-white truncate" title={analise.nfe_tomador_nome}>{analise.nfe_tomador_nome}</span>
          </>
        )}
        {analise.nfe_tomador_cnpj && (
          <>
            <span className="text-slate-400">CNPJ tomador</span>
            <span className="text-white font-mono">{analise.nfe_tomador_cnpj}</span>
          </>
        )}
        {analise.nfe_valor > 0 && (
          <>
            <span className="text-slate-400">Valor na NF</span>
            <span className={`font-semibold ${analise.valor_confere ? 'text-emerald-300' : 'text-amber-300'}`}>
              R$ {analise.nfe_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </>
        )}
        {analise.nfe_competencia && (
          <>
            <span className="text-slate-400">Competência</span>
            <span className="text-white">{analise.nfe_competencia}</span>
          </>
        )}
        {analise.nfe_descricao && (
          <>
            <span className="text-slate-400 self-start">Serviço</span>
            <span className="text-slate-300 line-clamp-2">{analise.nfe_descricao}</span>
          </>
        )}
      </div>

      {/* Validação cliente */}
      <div className="flex items-center gap-1.5">
        {analise.cliente_reconhecido
          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        }
        <span className={analise.cliente_reconhecido ? 'text-emerald-300' : 'text-red-300'}>
          {analise.cliente_reconhecido
            ? `Tomador reconhecido: ${clienteNome ?? 'cliente do evento'}`
            : `Tomador não corresponde ao cliente do evento`
          }
        </span>
      </div>

      {/* Divergências */}
      {divergencias.length > 0 && (
        <ul className="space-y-0.5">
          {divergencias.map((d, i) => (
            <li key={i} className="flex items-start gap-1.5 text-amber-200">
              <span className="mt-0.5">⚠</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function NFeAttachment({ event, client }) {
  const { update: updateEvent } = useEvents();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [numero, setNumero] = useState(event?.nfe_numero ?? '');
  const [savingNumero, setSavingNumero] = useState(false);

  const hasArquivo = Boolean(event?.nfe_arquivo_url);
  const hasNFe = hasArquivo || Boolean(event?.nfe_numero);
  const analise = event?.nfe_analise ?? null;
  const clienteNome = client ? getClientDisplayName(client) : null;

  async function runAnalise(pdfUrl) {
    setAnalyzing(true);
    try {
      const eventContext = {
        titulo: event.title,
        cliente_nome: clienteNome,
        cliente_cnpj: client?.cnpj ?? null,
        valor: getEventCacheAmount(event) || null,
      };

      const { data, error } = await supabase.functions.invoke('analyze-nfe', {
        body: { pdf_url: pdfUrl, event_context: eventContext },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error ?? 'Falha na análise');

      const resultado = data.data;

      await updateEvent(event.id, {
        nfe_analise: resultado,
        nfe_numero: resultado.nfe_numero ?? event.nfe_numero ?? null,
      });

      if (resultado.cliente_reconhecido && resultado.valor_confere) {
        toast.success('NF-e verificada pela IA — tudo confere!');
      } else {
        toast.warning('NF-e analisada — verifique as divergências apontadas.');
      }
    } catch (err) {
      toast.error(`Erro na análise: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['application/pdf'].includes(file.type) && !/\.pdf$/i.test(file.name)) {
      toast.error('Envie apenas PDF da NF-e.');
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

      // Remove arquivo anterior
      if (event.nfe_arquivo_url) {
        const oldPath = extractStoragePath(event.nfe_arquivo_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      const path = `${userId}/nfe/${event.id}-${Date.now()}.pdf`;
      const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;

      await updateEvent(event.id, {
        nfe_arquivo_url: publicUrl,
        nfe_arquivo_nome: file.name,
        nfe_numero: numero.trim() || event.nfe_numero || null,
        nfe_analise: null, // limpa análise anterior
      });

      toast.success('PDF enviado — analisando com IA...');
      setUploading(false);

      // Dispara análise automática
      await runAnalise(publicUrl);
    } catch (err) {
      toast.error(`Erro ao enviar: ${err.message}`);
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
        nfe_analise: null,
      });
      setNumero('');
      toast.success('NF-e removida do evento.');
    } catch {
      toast.error('Erro ao remover NF-e.');
    }
  }

  const isLoading = uploading || analyzing;

  // ── NF-e já registrada ────────────────────────────────────────────────────
  if (hasNFe) {
    return (
      <div className="space-y-2">
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
                {!event.nfe_arquivo_nome && !event.nfe_numero && (
                  <p className="text-xs text-slate-400">Arquivo anexado</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {isLoading && (
                <span className="text-xs text-blue-300 flex items-center gap-1 mr-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {analyzing ? 'Analisando...' : 'Enviando...'}
                </span>
              )}
              {hasArquivo && !isLoading && (
                <>
                  <a href={event.nfe_arquivo_url} target="_blank" rel="noopener noreferrer" title="Baixar PDF">
                    <Button type="button" size="sm" variant="outline"
                      className="h-7 w-7 p-0 border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => runAnalise(event.nfe_arquivo_url)}
                    title="Re-analisar com IA"
                    className="h-7 w-7 p-0 border-slate-600 text-slate-300 hover:bg-slate-700">
                    <Sparkles className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {!isLoading && (
                <>
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    title="Substituir arquivo"
                    className="h-7 w-7 p-0 border-slate-600 text-slate-300 hover:bg-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                  </Button>
                  <Button type="button" size="sm" variant="outline"
                    onClick={handleDelete}
                    title="Remover NF-e"
                    className="h-7 w-7 p-0 border-red-800/50 text-red-400 hover:bg-red-900/20">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Resultado da análise IA */}
        {analyzing && (
          <div className="flex items-center gap-2 text-xs text-blue-300 px-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            IA lendo a NF-e e cruzando com os dados do evento...
          </div>
        )}
        <AnaliseCard analise={analise} clienteNome={clienteNome} />

        <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  // ── Sem NF-e — formulário para registrar ─────────────────────────────────
  return (
    <div className="border border-dashed border-blue-800/40 rounded-lg p-3 space-y-2.5 bg-blue-950/10">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <p className="text-xs text-slate-300 font-medium">Registrar NF-e emitida</p>
      </div>
      <p className="text-xs text-slate-500">
        Anexe o PDF — a IA vai ler e confirmar que é a NF do evento e desta empresa.
      </p>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Número da NF-e (opcional)"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveNumero()}
          className="h-8 text-sm bg-slate-800/80 border-slate-700 flex-1"
        />
        {numero.trim() && numero.trim() !== (event?.nfe_numero ?? '') && (
          <Button type="button" size="sm" disabled={savingNumero} onClick={handleSaveNumero}
            className="h-8 px-3 text-xs bg-blue-700 hover:bg-blue-600 text-white flex-shrink-0">
            {savingNumero ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-9 text-xs border-blue-700/40 text-blue-300 hover:bg-blue-900/20">
          {isLoading
            ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                {analyzing ? 'Analisando com IA...' : 'Enviando...'}
              </>
            : <><Upload className="w-3 h-3 mr-1.5" />Anexar PDF da NF-e</>
          }
        </Button>
        <a href="https://www.nfse.gov.br/EmissorNacional/Login" target="_blank" rel="noopener noreferrer">
          <Button type="button" size="sm" variant="outline"
            className="h-9 px-2.5 text-xs border-slate-600 text-slate-400 hover:bg-slate-700"
            title="Abrir portal NFS-e Nacional">
            <ExternalLink className="w-3 h-3" />
          </Button>
        </a>
      </div>

      <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileChange} />
    </div>
  );
}
