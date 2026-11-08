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
import { reconcileNFe } from '@/lib/nfeReconcile';
import { useClients } from '@/lib/useClients';
import { useAuth } from '@/lib/authContext';
import { useFinancialVisibility } from '@/components/context/FinancialVisibilityContext';
import { findCompanyByCNPJ, upsertCompanyRecord } from '@/lib/companyService';
import { toast } from 'sonner';
import { todayLocalISO } from '@/components/utils/dateUtils';
import { removePreviousNFe, replaceNFeFile, updateNFeWithLegacyFallback } from '@/lib/nfeFileSafety';

const BUCKET = 'backstage';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPT = 'application/pdf,.pdf';

// ── Card de resultado da análise IA ──────────────────────────────────────────
const brl = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCnpj = (d) => (d && d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : d || '');

function Linha({ ok, warn, children }) {
  const Icon = ok ? CheckCircle2 : warn ? AlertTriangle : XCircle;
  const color = ok || warn ? '#ffd400' : '#ff2e88';
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
      <div className="min-w-0 flex-1" style={{ color: ok ? '#ffd400' : '#e0e0e0' }}>{children}</div>
    </div>
  );
}

function AnaliseCard({ analise, clienteNome, conf, busy, onEscolherValor, onVincularCnpj, isVisible = true }) {
  if (!analise || !conf) return null;
  const empresaOk = conf.empresa === 'cnpj' || conf.empresa === 'nome';
  const valorOk = conf.valor === 'confere' || conf.escolha != null;
  const ok = empresaOk && valorOk;
  const money = (v) => (isVisible ? brl(v) : '•••••');

  return (
    <div className="rounded-lg border p-3 space-y-2.5 text-xs bg-[#ffd400]/10 border-[#ffd400]/30" data-testid="nfe-conferencia">
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="w-4 h-4 text-[#ffd400]" /> : <AlertTriangle className="w-4 h-4 text-[#ffd400]" />}
        <span className="font-semibold text-[#ffd400]">{ok ? 'Nota conferida' : 'Confira a nota'}</span>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 bg-[#161616] rounded px-2.5 py-2">
        {analise.nfe_numero && (<><span className="text-[#a8a8a8]">Número</span><span className="text-white font-tag">{analise.nfe_numero}</span></>)}
        {analise.nfe_tomador_nome && (<><span className="text-[#a8a8a8]">Empresa na nota</span><span className="text-white break-words">{analise.nfe_tomador_nome}</span></>)}
        {analise.nfe_tomador_cnpj && (<><span className="text-[#a8a8a8]">CNPJ</span><span className="text-white font-tag">{fmtCnpj(String(analise.nfe_tomador_cnpj))}</span></>)}
        {analise.nfe_competencia && (<><span className="text-[#a8a8a8]">Competência</span><span className="text-white">{analise.nfe_competencia}</span></>)}
        {analise.nfe_descricao && (<><span className="text-[#a8a8a8] self-start">Serviço</span><span className="text-[#c8c8c8] line-clamp-2">{analise.nfe_descricao}</span></>)}
      </div>

      {/* Empresa */}
      {conf.empresa === 'cnpj' && <Linha ok>Empresa confere pelo CNPJ ({clienteNome || 'cliente do trabalho'}).</Linha>}
      {conf.empresa === 'nome' && (
        <Linha ok>
          Empresa reconhecida: {clienteNome || 'cliente do trabalho'}.
          {conf.podeVincularCnpj && (
            <button type="button" disabled={busy} onClick={onVincularCnpj}
              className="block mt-1 text-[11px] underline underline-offset-2 text-white disabled:opacity-50">
              Guardar o CNPJ e a razão social da nota no cadastro
            </button>
          )}
        </Linha>
      )}
      {conf.empresa === 'nome_diferente' && (
        <Linha warn>
          O nome na nota é diferente do cadastro ({clienteNome || 'sem cliente'}).
          {conf.podeVincularCnpj ? (
            <button type="button" disabled={busy} onClick={onVincularCnpj}
              className="mt-1.5 w-full h-9 rounded-full bg-[#ffd400] text-[#0a0a0a] font-bold disabled:opacity-50">
              É a mesma empresa — guardar o CNPJ da nota
            </button>
          ) : <span className="block text-[#a8a8a8]">Confira se a nota é deste trabalho.</span>}
        </Linha>
      )}
      {conf.empresa === 'cnpj_diferente' && (
        <Linha>O CNPJ da nota é de outra empresa. Confira se a nota é deste trabalho.</Linha>
      )}

      {/* Valor */}
      {conf.valor === 'sem_valor' && <Linha warn>A IA não encontrou o valor na nota.</Linha>}
      {conf.valor === 'confere' && <Linha ok>Valor confere: {money(conf.valorNota)}.</Linha>}
      {conf.valor === 'diferente' && (
        <div className="space-y-1.5" data-testid="nfe-escolha-valor">
          <Linha warn>
            Valor diferente: nota {money(conf.valorNota)} · app {money(conf.valorApp)}
            {isVisible ? ` (${conf.diferenca > 0 ? '+' : '−'}${brl(Math.abs(conf.diferenca))})` : ''}.
          </Linha>
          <div className="grid grid-cols-2 gap-2">
            {[['nota', 'Usar valor da nota', conf.valorNota], ['app', 'Manter valor do app', conf.valorApp]].map(([key, label, v]) => {
              const active = conf.escolha === key;
              return (
                <button key={key} type="button" disabled={busy} aria-pressed={active}
                  onClick={() => onEscolherValor(active ? null : key)}
                  className={`rounded-lg border px-2 py-2 text-left disabled:opacity-50 ${active ? 'bg-[#ffd400] border-[#ffd400] text-[#0a0a0a]' : 'bg-[#161616] border-[#333333] text-white'}`}>
                  <span className="block font-bold text-[12px]">{label}</span>
                  <span className="block text-[11px] opacity-80">{money(v)}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#a8a8a8]">
            {conf.escolha === 'nota' ? 'O A receber, o Recebi e os relatórios usam o valor da nota. Toque de novo para desfazer.'
              : conf.escolha === 'app' ? 'Fica o valor calculado no app. Toque de novo para desfazer.'
                : 'Escolha qual valor vale para este trabalho.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function NFeAttachment({ event, client, appAmount }) {
  const { update: updateEvent } = useEvents();
  const { update: updateClient } = useClients();
  const { user } = useAuth();
  const { isVisible } = useFinancialVisibility();
  const [conferindo, setConferindo] = useState(false);
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
  // Cópia local: a escolha aparece na hora, sem esperar a tela recarregar o trabalho.
  const [analiseLocal, setAnaliseLocal] = useState(null);
  useEffect(() => { setAnaliseLocal(null); }, [event?.id, event?.nfe_analise]);
  const analise = analiseLocal ?? event?.nfe_analise ?? null;
  const clienteNome = client ? getClientDisplayName(client) : null;

  async function safeUpdateNFe(patch) {
    return updateNFeWithLegacyFallback(updateEvent, event.id, patch);
  }

  async function runAnalise(pdfUrl) {
    setAnalyzing(true);
    try {
      const eventContext = {
        titulo: event.title,
        cliente_nome: clienteNome,
        cliente_cnpj: client?.cnpj ?? null,
        // Valor calculado do trabalho (com horas extras/dobras), não o cachê base.
        valor: (appAmount ?? getEventCacheAmount(event)) || null,
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
      setAnaliseLocal(resultado);

      const conf = reconcileNFe({ analise: resultado, client, expectedAmount: appAmount ?? getEventCacheAmount(event) });
      if (['cnpj', 'nome'].includes(conf.empresa) && conf.valor === 'confere') {
        toast.success('Nota conferida — empresa e valor batem com o trabalho!');
      } else if (conf.valor === 'diferente') {
        toast.warning('Nota lida — o valor é diferente do app. Escolha qual valor vale.');
      } else {
        toast.warning('Nota lida — confira a empresa da nota.');
      }
    } catch (err) {
      toast.error(`Erro na análise: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  // "Usar valor da nota" / "Manter valor do app" — guardado na própria análise da nota.
  async function handleEscolherValor(escolha) {
    if (!analise) return;
    setConferindo(true);
    try {
      const next = { ...analise, escolha_valor: escolha, escolha_em: escolha ? new Date().toISOString() : null };
      await safeUpdateNFe({ nfe_analise: next });
      setAnaliseLocal(next);
      toast.success(escolha === 'nota' ? 'Valor da nota aplicado ao trabalho.' : escolha === 'app' ? 'Mantido o valor do app.' : 'Escolha desfeita.');
    } catch (err) {
      toast.error(`Não foi possível salvar: ${err.message}`);
    } finally {
      setConferindo(false);
    }
  }

  // Guarda o CNPJ e a razão social da nota no cadastro do cliente (empresa vinculada).
  async function handleVincularCnpj() {
    if (!analise?.nfe_tomador_cnpj || !client?.id) return;
    setConferindo(true);
    try {
      const cnpj = String(analise.nfe_tomador_cnpj).replace(/\D/g, '');
      const company = (await findCompanyByCNPJ(cnpj))
        || (await upsertCompanyRecord({ name: analise.nfe_tomador_nome || clienteNome, trading_name: clienteNome, cnpj, source: 'nfe' }, user?.id));
      if (!company?.id) throw new Error('empresa não encontrada');
      await updateClient(client.id, { company_id: company.id });
      const next = { ...analise, cliente_reconhecido: true, cnpj_guardado: true };
      await safeUpdateNFe({ nfe_analise: next });
      setAnaliseLocal(next);
      toast.success('CNPJ guardado no cadastro do cliente.', { description: 'As próximas notas desta empresa são reconhecidas pelo CNPJ.' });
    } catch (err) {
      toast.error(`Não foi possível guardar o CNPJ: ${err.message}`);
    } finally {
      setConferindo(false);
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

      const resolvedNum = numero.trim() || currentSavedNumero || null;
      const { url: publicUrl, cleanupPending } = await replaceNFeFile({
        storage: supabase.storage.from(BUCKET), file, userId, eventId: event.id,
        previousUrl: event.nfe_arquivo_url,
        update: safeUpdateNFe,
        patch: {
          nfe_numero: resolvedNum,
          nf_number: resolvedNum,
          nf_issued_at: issuedAt || event?.nf_issued_at || todayLocalISO(),
          nfe_analise: null,
        },
      });
      if (cleanupPending) toast.warning('Novo PDF salvo. A limpeza do arquivo anterior ficou pendente.');

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
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) throw new Error('Não autenticado.');
      await safeUpdateNFe({
        nfe_arquivo_url: null,
        nfe_arquivo_nome: null,
        nfe_numero: null,
        nf_number: null,
        nf_issued_at: null,
        nfe_analise: null,
      });
      const cleaned = await removePreviousNFe(supabase.storage.from(BUCKET), event.nfe_arquivo_url, authData.user.id);
      if (!cleaned) toast.warning('Vínculo removido. A limpeza do arquivo ficou pendente.');
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
        <AnaliseCard
          analise={analise}
          clienteNome={clienteNome}
          conf={analise ? reconcileNFe({ analise, client, expectedAmount: appAmount ?? getEventCacheAmount(event) }) : null}
          busy={conferindo}
          isVisible={isVisible}
          onEscolherValor={handleEscolherValor}
          onVincularCnpj={handleVincularCnpj}
        />

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
