import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Sparkles, Loader2, Send, Volume2, VolumeX, Upload, X, History, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { agentSDK } from '@/components/agents';
import { useAppData } from '@/components/context/AppDataContext';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';
import MessageBubble from '@/components/ai/MessageBubble';
import SmartSuggestions from '@/components/ai/SmartSuggestions';
import { UploadFile } from '@/api/integrations';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function ConversationItem({ conv, isActive, onSelect }) {
  const firstMsg = conv.messages?.[0];
  const preview = firstMsg?.content?.slice(0, 60) || 'Conversa vazia';
  const date = conv.created_at
    ? format(parseISO(conv.created_at), "d MMM", { locale: ptBR })
    : '';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(conv)}
      className={`w-full text-left p-3 rounded-xl transition-all ${
        isActive
          ? 'bg-cyan-600/20 border border-cyan-500/40'
          : 'bg-slate-800/50 border border-transparent hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {conv.metadata?.name || 'Conversa'}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{preview}</p>
        </div>
        <span className="text-xs text-slate-600 flex-shrink-0">{date}</span>
      </div>
    </motion.button>
  );
}

export default function AIMentorPage() {
  const { data } = useAppData();
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const convs = await agentSDK.listConversations({ agent_name: 'AIMentor' });
        setConversations(convs || []);
        if (convs?.length > 0) {
          handleSelectConversation(convs[0]);
        }
      } catch {
        toast.error('Erro ao carregar histórico de conversas');
      } finally {
        setLoadingConversations(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!currentConversation?.id) return;
    unsubscribeRef.current = agentSDK.subscribeToConversation(
      currentConversation.id,
      (evt) => setMessages(evt.messages || [])
    );
    return () => unsubscribeRef.current?.();
  }, [currentConversation?.id]);

  useEffect(() => {
    if (!isAudioEnabled || !messages.length) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last?.content) speakMessage(last.content);
  }, [messages, isAudioEnabled]);

  const speakMessage = useCallback((text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    const ptVoice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('pt'));
    if (ptVoice) utterance.voice = ptVoice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => {
      if (prev) window.speechSynthesis.cancel();
      toast.success(!prev ? '🔊 Áudio ativado' : '🔇 Áudio desativado');
      return !prev;
    });
  }, []);

  const handleSelectConversation = async (conversation) => {
    try {
      const full = await agentSDK.getConversation(conversation.id);
      setCurrentConversation(full);
      setMessages(full.messages || []);
      setHistoryOpen(false);
    } catch {
      toast.error('Erro ao carregar conversa');
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await agentSDK.createConversation({
        agent_name: 'AIMentor',
        metadata: { name: `Conversa - ${new Date().toLocaleDateString('pt-BR')}` }
      });
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      setUploadedFiles([]);
      setHistoryOpen(false);
      toast.success('Nova conversa iniciada');
    } catch {
      toast.error('Erro ao criar nova conversa');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await UploadFile({ file });
          return { name: file.name, url: file_url };
        })
      );
      setUploadedFiles(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} arquivo(s) enviado(s)`);
    } catch {
      toast.error('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (overrideMessage) => {
    const userMessage = (overrideMessage ?? inputMessage).trim();
    if (!userMessage && uploadedFiles.length === 0) return;

    let conv = currentConversation;
    if (!conv) {
      try {
        conv = await agentSDK.createConversation({
          agent_name: 'AIMentor',
          metadata: { name: `Conversa - ${new Date().toLocaleDateString('pt-BR')}` }
        });
        setConversations(prev => [conv, ...prev]);
        setCurrentConversation(conv);
      } catch {
        toast.error('Erro ao criar conversa');
        return;
      }
    }

    const filesToSend = [...uploadedFiles];
    setInputMessage('');
    setUploadedFiles([]);
    setLoading(true);

    try {
      await agentSDK.addMessage(conv, {
        role: 'user',
        content: userMessage || '(arquivo anexado)',
        file_urls: filesToSend.length > 0 ? filesToSend.map(f => f.url) : undefined
      });
    } catch (error) {
      toast.error('Erro ao enviar mensagem', { description: error.message || 'Tente novamente' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    handleSendMessage(suggestion);
  };

  if (loadingConversations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando AI Mentor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <Sparkles className="w-7 h-7 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-30 rounded-full" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">AI Mentor Pro</h1>
              {currentConversation && (
                <p className="text-xs text-slate-500 truncate">
                  {currentConversation.metadata?.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAudio}
              className={`border-slate-700 w-9 h-9 ${isAudioEnabled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              title={isAudioEnabled ? 'Desativar áudio' : 'Ativar áudio'}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              className="border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 w-9 h-9 relative"
              title="Histórico de conversas"
            >
              <History className="w-4 h-4" />
              {conversations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {Math.min(conversations.length, 9)}
                </span>
              )}
            </Button>

            <Button
              onClick={handleNewConversation}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 h-9 px-3 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-5xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative mb-6">
              <Sparkles className="w-14 h-14 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-20 rounded-full" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Olá, {profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Profissional'}!
            </h2>
            <p className="text-slate-400 mb-8 max-w-md text-sm">
              Sou seu consultor financeiro pessoal. Posso te ajudar com análises, relatórios, insights e muito mais!
            </p>
            <SmartSuggestions userData={data} onSuggestionClick={handleSuggestionClick} />
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            <AnimatePresence>
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-sm px-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando resposta...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 bg-slate-900/50 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-slate-300 truncate max-w-[150px]">{file.name}</span>
                  <button onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.csv,.xlsx" onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={loading || uploading} className="bg-slate-800 border-slate-700 hover:bg-slate-700 flex-shrink-0 h-[52px] w-10">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>

            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pergunte sobre seus dados financeiros..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none min-h-[52px] max-h-[160px]"
              rows={1}
              disabled={loading}
            />

            <Button onClick={() => handleSendMessage()} disabled={loading || (!inputMessage.trim() && uploadedFiles.length === 0)} className="bg-cyan-600 hover:bg-cyan-700 h-[52px] px-5 flex-shrink-0">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>

          <p className="text-xs text-slate-600 mt-2 text-center">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      </div>

      {/* Histórico de conversas — Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="left" className="bg-slate-900 border-slate-800 w-80 flex flex-col p-0">
          <SheetHeader className="p-4 border-b border-slate-800">
            <SheetTitle className="text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Histórico
            </SheetTitle>
          </SheetHeader>

          <div className="p-3">
            <Button onClick={handleNewConversation} className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2">
              <Plus className="w-4 h-4" />
              Nova Conversa
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhuma conversa ainda
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={currentConversation?.id === conv.id}
                  onSelect={handleSelectConversation}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
