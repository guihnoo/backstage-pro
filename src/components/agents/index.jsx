import { InvokeLLM } from '@/api/integrations';

const listeners = new Map();

function emit(conversationId, data) {
  const fns = listeners.get(conversationId) || [];
  fns.forEach(fn => fn(data));
}

export const agentSDK = {
  // Criar nova conversa
  async createConversation({ agent_name, metadata = {} }) {
    const id = crypto.randomUUID();
    const conversation = {
      id,
      agent_name,
      metadata: {
        name: metadata.name || 'Nova Conversa',
        description: metadata.description || '',
        ...metadata
      },
      messages: [],
      status: 'idle',
      created_at: new Date().toISOString()
    };
    
    // Emitir evento inicial
    setTimeout(() => emit(id, conversation), 0);
    return conversation;
  },

  // Listar conversas (mock - em produção viria do backend)
  async listConversations({ agent_name }) {
    return [];
  },

  // Obter conversa específica
  async getConversation(conversationId) {
    return {
      id: conversationId,
      agent_name: 'RelatorioInteligente',
      metadata: { name: 'Conversa', description: '' },
      messages: [],
      status: 'idle'
    };
  },

  // Atualizar conversa
  async updateConversation(conversationId, updates) {
    const conversation = await this.getConversation(conversationId);
    const updated = { ...conversation, ...updates };
    emit(conversationId, updated);
    return updated;
  },

  // Adicionar mensagem e obter resposta da IA
  async addMessage(conversation, message) {
    const conversationId = typeof conversation === 'string' ? conversation : conversation.id;
    
    // Mensagem do usuário
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.content,
      file_urls: message.file_urls || [],
      timestamp: new Date().toISOString()
    };

    // Emitir conversa com mensagem do usuário
    emit(conversationId, {
      id: conversationId,
      status: 'running',
      messages: [userMessage]
    });

    try {
      // Chamada para o LLM
      const response = await InvokeLLM({
        prompt: `Como analista financeiro especialista do Backstage Pro, responda de forma profissional e detalhada sobre: ${message.content}`,
        add_context_from_internet: false,
        file_urls: message.file_urls
      });

      // Mensagem da IA
      const aiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response || 'Resposta gerada com sucesso.',
        timestamp: new Date().toISOString(),
        tool_calls: [] // Para compatibilidade com MessageBubble
      };

      // Emitir conversa completa
      emit(conversationId, {
        id: conversationId,
        status: 'completed',
        messages: [userMessage, aiMessage]
      });

      return aiMessage;
    } catch (error) {
      console.error('Erro ao gerar resposta da IA:', error);
      
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao gerar a resposta. Tente novamente.',
        timestamp: new Date().toISOString(),
        tool_calls: []
      };

      emit(conversationId, {
        id: conversationId,
        status: 'error',
        messages: [userMessage, errorMessage]
      });

      return errorMessage;
    }
  },

  // Subscrever a atualizações da conversa
  subscribeToConversation(conversationId, callback) {
    const existingCallbacks = listeners.get(conversationId) || [];
    existingCallbacks.push(callback);
    listeners.set(conversationId, existingCallbacks);

    // Retornar função de cleanup
    return () => {
      const callbacks = listeners.get(conversationId) || [];
      const filtered = callbacks.filter(fn => fn !== callback);
      if (filtered.length > 0) {
        listeners.set(conversationId, filtered);
      } else {
        listeners.delete(conversationId);
      }
    };
  }
};