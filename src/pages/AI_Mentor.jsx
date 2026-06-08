import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2, TrendingUp, AlertCircle, Send, Mic, MicOff, Volume2, VolumeX, Upload, X } from 'lucide-react';
import { agentSDK } from '@/components/agents';
import { useAppData } from '@/components/context/AppDataContext';
import { User } from '@/api/entities';
import { toast } from 'sonner';
import MessageBubble from '@/components/ai/MessageBubble';
import SmartSuggestions from '@/components/ai/SmartSuggestions';
import { UploadFile } from '@/api/integrations';

export default function AIMentorPage() {
  const { data } = useAppData();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [user, setUser] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const audioRef = useRef(null);

  // Scroll to bottom quando novas mensagens chegam
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar usuário
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        toast.error('Erro ao carregar dados do usuário');
      }
    };
    loadUser();
  }, []);

  // Carregar conversas
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convs = await agentSDK.listConversations({ agent_name: 'AIMentor' });
        setConversations(convs || []);
        
        if (convs && convs.length > 0) {
          // Carregar última conversa
          handleSelectConversation(convs[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        toast.error('Erro ao carregar histórico de conversas');
      } finally {
        setLoadingConversations(false);
      }
    };

    if (user) {
      loadConversations();
    }
  }, [user]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (currentConversation?.id) {
      unsubscribeRef.current = agentSDK.subscribeToConversation(
        currentConversation.id,
        (data) => {
          setMessages(data.messages || []);
        }
      );

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    }
  }, [currentConversation?.id]);

  // Text-to-Speech quando novas mensagens de assistente chegam
  useEffect(() => {
    if (!isAudioEnabled || !messages.length) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage?.content) {
      speakMessage(lastMessage.content);
    }
  }, [messages, isAudioEnabled]);

  const speakMessage = useCallback((text) => {
    if (!isAudioEnabled) return;

    // Cancelar qualquer fala anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Tentar encontrar voz em português
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(voice => voice.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [isAudioEnabled]);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => {
      const newState = !prev;
      
      if (!newState) {
        // Se desabilitando, cancelar qualquer fala em andamento
        window.speechSynthesis.cancel();
      }
      
      toast.success(newState ? '🔊 Áudio ativado' : '🔇 Áudio desativado');
      return newState;
    });
  }, []);

  const handleSelectConversation = async (conversation) => {
    try {
      const fullConv = await agentSDK.getConversation(conversation.id);
      setCurrentConversation(fullConv);
      setMessages(fullConv.messages || []);
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      toast.error('Erro ao carregar conversa');
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await agentSDK.createConversation({
        agent_name: 'AIMentor',
        metadata: {
          name: `Conversa - ${new Date().toLocaleDateString('pt-BR')}`,
          description: 'Nova conversa com AI Mentor'
        }
      });

      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      setUploadedFiles([]);
      
      toast.success('Nova conversa iniciada');
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast.error('Erro ao criar nova conversa');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await UploadFile({ file });
        return { name: file.name, url: file_url };
      });

      const uploaded = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} arquivo(s) enviado(s)`);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;
    if (!currentConversation) {
      await handleNewConversation();
      return;
    }

    const userMessage = inputMessage.trim();
    const filesToSend = [...uploadedFiles];
    
    setInputMessage('');
    setUploadedFiles([]);
    setLoading(true);

    try {
      await agentSDK.addMessage(currentConversation, {
        role: 'user',
        content: userMessage || '(arquivo anexado)',
        file_urls: filesToSend.length > 0 ? filesToSend.map(f => f.url) : undefined
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem', {
        description: error.message || 'Tente novamente'
      });
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

  const handleSuggestionClick = async (suggestion) => {
    setInputMessage(suggestion);
    // Auto-enviar sugestão
    setTimeout(() => {
      handleSendMessage();
    }, 100);
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
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-30 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">AI Mentor Pro</h1>
              <p className="text-xs sm:text-sm text-slate-400">Seu consultor financeiro inteligente</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Áudio */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAudio}
              className={`border-slate-700 ${
                isAudioEnabled 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
              title={isAudioEnabled ? 'Desativar áudio' : 'Ativar áudio'}
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>

            {/* Nova Conversa */}
            <Button
              onClick={handleNewConversation}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 hidden sm:flex"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Nova Conversa
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full">
        {/* Messages Area */}
        <ScrollArea className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="relative mb-6">
                <Sparkles className="w-16 h-16 text-cyan-400" />
                <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-20 rounded-full"></div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Olá, {user?.full_name?.split(' ')[0] || 'Profissional'}! 👋
              </h2>
              <p className="text-slate-400 mb-8 max-w-md">
                Sou seu consultor financeiro pessoal. Posso te ajudar com análises, relatórios, insights e muito mais!
              </p>

              {/* Smart Suggestions */}
              <SmartSuggestions
                userData={data}
                onSuggestionClick={handleSuggestionClick}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-slate-800 bg-slate-900/50 p-4 sm:p-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-slate-300 truncate max-w-[150px]">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 sm:gap-3">
              {/* Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.csv,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploading}
                className="bg-slate-800 border-slate-700 hover:bg-slate-700 flex-shrink-0"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </Button>

              {/* Message Input */}
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pergunte sobre seus dados financeiros..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none min-h-[52px] max-h-[200px]"
                  rows={1}
                  disabled={loading}
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={loading || (!inputMessage.trim() && uploadedFiles.length === 0)}
                className="bg-cyan-600 hover:bg-cyan-700 h-[52px] px-6 flex-shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-500 mt-2 text-center">
              Pressione Enter para enviar • Shift+Enter para nova linha
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const ScrollArea = ({ children, className }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};