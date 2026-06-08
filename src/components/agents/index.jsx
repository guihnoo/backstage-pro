import { supabase } from '@/lib/supabase';

const listeners = new Map();
const conversationCache = new Map();

function emit(conversationId, data) {
  conversationCache.set(conversationId, data);
  const fns = listeners.get(conversationId) || [];
  fns.forEach(fn => fn(data));
}

export const agentSDK = {
  async createConversation({ agent_name, metadata = {} }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const title = metadata.name || `Conversa - ${new Date().toLocaleDateString('pt-BR')}`;

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, title, messages: [], context: {} })
      .select()
      .single();

    if (error) throw error;

    const conversation = {
      id: data.id,
      agent_name,
      metadata: { name: data.title, ...metadata },
      messages: [],
      status: 'idle',
      created_at: data.created_at,
    };

    conversationCache.set(data.id, conversation);
    return conversation;
  },

  async listConversations({ agent_name: _agent_name }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) return [];

    return (data || []).map(row => ({
      id: row.id,
      metadata: { name: row.title },
      messages: row.messages || [],
      status: 'idle',
      created_at: row.created_at,
    }));
  },

  async getConversation(conversationId) {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      metadata: { name: data.title },
      messages: data.messages || [],
      status: 'idle',
      created_at: data.created_at,
    };
  },

  async addMessage(conversation, message) {
    const conversationId = typeof conversation === 'string' ? conversation : conversation.id;

    const { data: current } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();

    const history = current?.messages || [];

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.content,
      file_urls: message.file_urls || [],
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...history, userMessage];

    emit(conversationId, {
      id: conversationId,
      status: 'running',
      messages: updatedMessages,
    });

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context: {},
        },
      });

      if (fnError) throw fnError;

      const aiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fnData?.answer ?? 'Não foi possível gerar uma resposta.',
        timestamp: new Date().toISOString(),
        tool_calls: [],
      };

      const finalMessages = [...updatedMessages, aiMessage];

      await supabase
        .from('ai_conversations')
        .update({ messages: finalMessages, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      emit(conversationId, {
        id: conversationId,
        status: 'completed',
        messages: finalMessages,
      });

      return aiMessage;
    } catch (error) {
      console.error('Erro ao gerar resposta da IA:', error);

      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao gerar a resposta. Verifique se o AI Mentor está configurado corretamente.',
        timestamp: new Date().toISOString(),
        tool_calls: [],
      };

      const finalMessages = [...updatedMessages, errorMessage];

      emit(conversationId, {
        id: conversationId,
        status: 'error',
        messages: finalMessages,
      });

      return errorMessage;
    }
  },

  subscribeToConversation(conversationId, callback) {
    const existing = listeners.get(conversationId) || [];
    existing.push(callback);
    listeners.set(conversationId, existing);

    const cached = conversationCache.get(conversationId);
    if (cached) setTimeout(() => callback(cached), 0);

    return () => {
      const cbs = listeners.get(conversationId) || [];
      const filtered = cbs.filter(fn => fn !== callback);
      if (filtered.length > 0) {
        listeners.set(conversationId, filtered);
      } else {
        listeners.delete(conversationId);
      }
    };
  },
};
