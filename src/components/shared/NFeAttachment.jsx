import { useState, useRef, useEffect } from 'react';
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
import { todayLocalISO } from '@/components/utils/dateUtils';

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
        ? 'bg-[#ffd400]/20 border-[#ffd400]/30'
        : 'bg-[#ffd400]/20 border-[#ffd400]/30'
    }`}>
      {/* Status geral */}
      <div className="flex items-center gap-2">
        {ok
          ? <CheckCircle2 className="w-4 h-4 text-[#ffd400] flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-[#ffd400] flex-shrink-0" />
        }
        <span className={`font-semibold ${ok ? 'text-[#ffd400]' : 'text-[#ffd400]'}`}>
          {ok ? 'NF-e verificada pela IA' : 'Atenção — divergências encontradas'}
        </span>
      </div>

      {/* Dados extraídos */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-[#161616] rounded px-2.5 py-2">
        {analise.nfe_numero && (
          <>
            <span className="text-[#a8a8a8]">Número</span>
            <span className="text-white font-tag font-medium">{analise.nfe_numero}</span>
          </>
        )}
        {analise.nfe_tomador_nome && (
          <>
            <span className="text-[#a8a8a8]">Tomador</span>
            <span className="text-white truncate" title={analise.nfe_tomador_nome}>{analise.nfe_tomador_nome}</span>
          </>
        )}
        {analise.nfe_tomador_cnpj && (
          <>
            <span className="text-[#a8a8a8]">CNPJ tomador</span>
            <span className="text-white font-tag">{analise.nfe_tomador_cnpj}</span>
          </>
        )}
        {analise.nfe_valor > 0 && (
          <>
            <span className="text-[#a8a8a8]">Valor na NF</span>
            <span className={`font-semibold ${analise.valor_confere ? 'text-[#ffd400]' : 'text-[#ffd400]'}`}>
              R$ {analise.nfe_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </>
        )}
        {analise.nfe_competencia && (
          <>
            <span className="text-[#a8a8a8]">Competência</span>
            <span className="text-white">{analise.nfe_competencia}</span>
          </>
        )}
        {analise.nfe_descricao && (
          <>
            <span className="text-[#a8a8a8] self-start">Serviço</span>
            <span className="text-[#c8c8c8] line-clamp-2">{analise.nfe_descricao}</span>
          </>
        )}
      </div>

      {/* Validação cliente */}
      <div className="flex items-center gap-1.5">
        {analise.cliente_reconhecido
          ? <CheckCircle2 className="w-3.5 h-3.5 text-[#ffd400] flex-shrink-0" />
          : <XCircle className="w-3.5 h-3.5 text-[#ff2e88] flex-shrink-0" />
        }
        <span className={analise.cliente_reconhecido ? 'text-[#ffd400]' : 'text-[#ff2e88]'}>
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
            <li key={i} className="flex items-start gap-1.5 text-[#ffd400]">
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

  const currentSavedNumero = event?.nfe_numero || event?.nf_number || '';
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [numero, setNumero] = useState(currentSavedNumero);
  const [issuedAt, setIssuedAt] = useState(event?.nf_issued_at || '');

  useEffect(() => {
    setNumero(event?.nfe_numero || event?.nf_number || '');
    setIssuedAt(event?.nf_issued_at || '');
  }, [event?.id, event?.nfe_numero, event?.nf_number, event?.nf_issued_at]);
  const [savingNumero, setSavingNumero] = useState(false);

  const hasArquivo = Boolean(event?.nfe_arquivo_url);
  const hasNFe = hasArquivo || Boolean(currentSavedNumero);
  const analise = event?.nfe_analise ?? null;
  const clienteNome = client ? getClientDisplayName(client) : null;

  async function safeUpdateNFe(patch) {
    try {
      return await updateEvent(event.id, patch);
    } catch (err) {
      // Fallback caso a migration 034 ainda não tenha sido aplicada no banco remoto
      if (patch.nfe_numero !== undefined) {
        return await updateEvent(event.id, {
          nf_number: patch.nfe_numero,
          ...(patch.nf_issued_at !== undefined ? { nf_issued_at: patch.nf_issued_at } : {}),
        });
      }
      throw err;
    }
  }

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
      const resolvedNum = resultado.nfe_numero ?? currentSavedNumero ?? null;

      await safeUpdateNFe({
        nfe_analise: resultado,
        nfe_numero: resolvedNum,
        nf_number: resolvedNum,
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
      const resolvedNum = numero.trim() || currentSavedNumero || null;

      await safeUpdateNFe({
        nfe_arquivo_url: publicUrl,
        nfe_arquivo_nome: file.name,
        nfe_numero: resolvedNum,
        nf_number: resolvedNum,
        nf_issued_at: issuedAt || event?.nf_issued_at || todayLocalISO(),
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
      const cleanNum = numero.trim();
      const cleanDate = issuedAt || event?.nf_issued_at || todayLocalISO();
      await safeUpdateNFe({
        nfe_numero: cleanNum,
        nf_number: cleanNum,
        nf_issued_at: cleanDate,
      });
      toast.success('Dados da NF-e salvos e incluídos no PDF de Fechamento!');
    } catch {
      toast.error('Erro ao salvar número da NF-e.');
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
      await safeUpdateNFe({
        nfe_arquivo_url: null,
        nfe_arquivo_nome: null,
        nfe_numero: null,
        nf_number: null,
        nf_issued_at: null,
        nfe_analise: null,
      });
      setNumero('');
      setIssuedAt('');
      toast.success('NF-e removida do evento.');
    } catch {
      toast.error('Erro ao remover NF-e.');
    }
  }

  const isLoading = uploading || analyzing;

  // ── NF-e já registrada ────────────────────────────────────────────────────
  if (hasNFe) {
    return (
      <div className="space-y-2.5">
        <div className="bg-[#ffd400]/20 border border-[#ffd400]/30 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-[#ffd400] flex-shrink-0" />
              <div className="min-w-0">
                {currentSavedNumero && (
                  <p className="text-xs font-semibold text-white">
                    NF-e nº {currentSavedNumero}
                    {event?.nf_issued_at ? ` · Emitida em ${new Date(event.nf_issued_at + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
                  </p>
                )}
                {event.nfe_arquivo_nome && (
                  <p className="text-xs text-[#a8a8a8] truncate">{event.nfe_arquivo_nome}</p>
                )}
                {!event.nfe_arquivo_nome && !currentSavedNumero && (
                  <p className="text-xs text-[#a8a8a8]">Arquivo anexado</p>
                )}
                <p className="text-[11px] text-[#ffd400]/90 mt-0.5">
                  ✓ Vinculada ao Relatório PDF de Fechamento
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {isLoading && (
                <span className="text-xs text-[#ffd400] flex items-center gap-1 mr-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {analyzing ? 'Analisando...' : 'Enviando...'}
                </span>
              )}
              {hasArquivo && !isLoading && (
                <>
                  <a href={event.nfe_arquivo_url} target="_blank" rel="noopener noreferrer" title="Baixar PDF da NF-e">
                    <Button type="button" size="sm" variant="outline"
                      className="h-7 w-7 p-0 border-[#2a2a2a] text-[#c8c8c8] hover:bg-[#2a2a2a]">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => runAnalise(event.nfe_arquivo_url)}
                    title="Re-analisar com IA"
                    className="h-7 w-7 p-0 border-[#2a2a2a] text-[#c8c8c8] hover:bg-[#2a2a2a]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {!isLoading && (
                <>
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    title={hasArquivo ? 'Substituir PDF da NF-e' : 'Anexar PDF da NF-e'}
                    className="h-7 px-2 text-xs border-[#2a2a2a] text-[#c8c8c8] hover:bg-[#2a2a2a]">
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    {hasArquivo ? 'Trocar PDF' : 'Anexar PDF'}
                  </Button>
                  <Button type="button" size="sm" variant="outline"
                    onClick={handleDelete}
                    title="Remover NF-e"
                    className="h-7 w-7 p-0 border-[#ff2e88]/50 text-[#ff2e88] hover:bg-[#ff2e88]/20">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Edição rápida do número ou data da NF-e */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-[#ffd400]/30">
            <Input
              type="text"
              placeholder="Nº da NF-e (ex: 2026/042)"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNumero()}
              className="flex-1 min-w-[130px]"
            />
            <Input
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              className="w-[135px]"
              title="Data de emissão da NF-e"
            />
            {(numero.trim() !== currentSavedNumero || issuedAt !== (event?.nf_issued_at || '')) && numero.trim() && (
              <Button type="button" size="sm" disabled={savingNumero} onClick={handleSaveNumero}
                className="h-8 px-3 text-xs bg-[#ffd400] hover:bg-[#ffe033] text-[#0a0a0a] flex-shrink-0">
                {savingNumero ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Atualizar'}
              </Button>
            )}
          </div>
        </div>

        {/* Resultado da análise IA */}
        {analyzing && (
          <div className="flex items-center gap-2 text-xs text-[#ffd400] px-1">
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
    <div className="border border-[#222222] rounded-[12px] p-3 space-y-2.5 bg-[#0a0a0a]">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#ffd400]" />
        <p className="text-xs text-[#c8c8c8] font-medium">Inserir NF-e / NFS-e no evento</p>
      </div>
      <p className="text-xs text-[#a8a8a8]">
        Digite o número ou anexe o PDF da NF-e — os dados entram automaticamente no Relatório PDF de Fechamento.
      </p>

      <div className="flex flex-wrap gap-2">
        <Input
          type="text"
          placeholder="Número da NF-e (ex: 000142)"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveNumero()}
          className="flex-1 min-w-[140px]"
        />
        <Input
          type="date"
          value={issuedAt}
          onChange={(e) => setIssuedAt(e.target.value)}
          className="w-[135px]"
          title="Data de emissão"
        />
        {numero.trim() && (
          <Button type="button" size="sm" disabled={savingNumero} onClick={handleSaveNumero}
            className="h-8 px-3 text-xs bg-[#ffd400] hover:bg-[#ffe033] text-[#0a0a0a] flex-shrink-0">
            {savingNumero ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar Nº'}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-9 text-xs border-[#ffd400]/40 text-[#ffd400] hover:bg-[#ffd400]/20">
          {isLoading
            ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                {analyzing ? 'Analisando com IA...' : 'Enviando...'}
              </>
            : <><Upload className="w-3 h-3 mr-1.5" />Anexar PDF da NF-e</>
          }
        </Button>
        <a href="https://www.nfse.gov.br/EmissorNacional/Login" target="_blank" rel="noopener noreferrer">
          <Button type="button" size="sm" variant="outline"
            className="h-9 px-2.5 text-xs border-[#2a2a2a] text-[#a8a8a8] hover:bg-[#2a2a2a]"
            title="Abrir portal NFS-e Nacional">
            <ExternalLink className="w-3 h-3" />
          </Button>
        </a>
      </div>

      <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileChange} />
    </div>
  );
}
