import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Send,
  Bot,
  Paperclip,
  X
} from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { agentSDK } from '@/agents';
import MessageBubble from './MessageBubble';

export default function ChatInterface({ 
  conversation, 
  agentName,
  onConversationUpdate 
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversation && conversation.messages) {
      setMessages(conversation.messages);
    }
  }, [conversation]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = agentSDK.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      if (onConversationUpdate) {
        onConversationUpdate(data);
      }
    });

    return unsubscribe;
  }, [conversation?.id, onConversationUpdate]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsLoading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await UploadFile({ file });
        return {
          name: file.name,
          url: file_url,
          type: file.type,
          size: file.size
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachedFiles(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error("Erro no upload de arquivos:", error);
      alert('Erro ao fazer upload dos arquivos. Tente novamente.');
    }
    setIsLoading(false);
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && attachedFiles.length === 0) return;
    if (!conversation) return;

    const messageData = {
      role: 'user',
      content: inputText.trim(),
      file_urls: attachedFiles.map(f => f.url)
    };

    setIsLoading(true);
    setInputText('');
    setAttachedFiles([]);

    try {
      await agentSDK.addMessage(conversation, messageData);
      // Messages will be updated via subscription
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Bot className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Selecione um agente para iniciar uma conversa</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
          <AnimatePresence>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="text-slate-300 text-sm">Pensando...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <Badge key={index} variant="outline" className="bg-slate-800 border-slate-600 text-slate-300">
                  <Paperclip className="w-3 h-3 mr-1" />
                  {file.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachedFile(index)}
                    className="ml-1 h-4 w-4 p-0 hover:bg-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Digite sua mensagem para o ${agentName}...`}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                disabled={isLoading}
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!inputText.trim() && attachedFiles.length === 0)}
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}