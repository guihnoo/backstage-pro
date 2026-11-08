// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
const account = vi.hoisted(() => ({ id: 'A' }));
const invoke = vi.hoisted(() => vi.fn());
vi.mock('@/lib/authContext', () => ({ useAuth: () => ({ user: { id: account.id, email: 'teste@example.test' }, profile: { name: 'Teste', category: 'lighting' } }) }));
vi.mock('@/lib/useBackstageData', () => ({ useStats: () => ({ stats: {} }), useEvents: () => ({ events: [] }) }));
vi.mock('@/lib/useClients', () => ({ useClients: () => ({ clients: [] }) }));
vi.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke } } }));
vi.mock('@/lib/appToast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/context/FinancialVisibilityContext', () => ({ useFinancialVisibility: () => ({ formatCurrency: n => String(n), isVisible: true }) }));
vi.mock('@/components/ai/MessageBubble', () => ({ default: ({ message }) => <p>{message.content}</p> }));
vi.mock('@/components/ai/SmartSuggestions', () => ({ default: () => null }));
vi.mock('@/components/ui/sheet', () => ({ Sheet: ({ open, children }) => open ? <section>{children}</section> : null, SheetContent: ({ children }) => <div>{children}</div>, SheetHeader: ({ children }) => <div>{children}</div>, SheetTitle: ({ children }) => <h2>{children}</h2> }));
import AIMentorPage from './AI_Mentor';

beforeEach(() => {
  account.id = 'A'; localStorage.clear(); vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
const conversation = (id, text) => ({ id, name: `Conversa ${id}`, createdAt: '2026-10-30T12:00:00Z', messages: [{ role: 'user', content: text }] });

describe('Mentor ao trocar de conta com a tela aberta', () => {
  it('remove mensagens e carrega somente o histórico da nova conta', () => {
    localStorage.setItem('backstage_ai_conversations:A', JSON.stringify([conversation('A', 'mensagem da conta A')]));
    localStorage.setItem('backstage_ai_conversations:B', JSON.stringify([conversation('B', 'mensagem da conta B')]));
    const { rerender } = render(<AIMentorPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Histórico de conversas' }));
    fireEvent.click(screen.getByText('Conversa A'));
    expect(screen.queryByText('mensagem da conta A')).not.toBeNull();
    account.id = 'B'; rerender(<AIMentorPage />);
    expect(screen.queryByText('mensagem da conta A')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Histórico de conversas' }));
    expect(screen.queryByText('Conversa A')).toBeNull();
    expect(screen.queryByText('Conversa B')).not.toBeNull();
  });
  it('resposta atrasada da conta A não aparece nem é salva na conta B', async () => {
    let finish;
    invoke.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { rerender } = render(<AIMentorPage />);
    fireEvent.change(screen.getByPlaceholderText('Pergunte qualquer coisa…'), { target: { value: 'pergunta sintética A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));
    expect(invoke).toHaveBeenCalledTimes(1);
    account.id = 'B'; rerender(<AIMentorPage />);
    await act(async () => { finish({ data: { answer: 'resposta privada tardia A' }, error: null }); });
    expect(screen.queryByText('resposta privada tardia A')).toBeNull();
    expect(localStorage.getItem('backstage_ai_conversations:B')).toBeNull();
    expect(localStorage.getItem('backstage_ai_conversations:A')).not.toContain('resposta privada tardia A');
  });
  it('não apresenta histórico legado de dono desconhecido', () => {
    localStorage.setItem('backstage_ai_conversations', JSON.stringify([conversation('legado', 'texto legado') ]));
    render(<AIMentorPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Histórico de conversas' }));
    expect(screen.queryByText('Conversa legado')).toBeNull();
    expect(screen.queryByText('Nenhuma conversa ainda')).not.toBeNull();
    expect(localStorage.getItem('backstage_ai_conversations')).toContain('texto legado');
  });
});
