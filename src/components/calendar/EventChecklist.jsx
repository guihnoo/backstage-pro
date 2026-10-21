import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategoryTheme } from '@/lib/useCategoryTheme';

const TEMPLATES = {
  audio: {
    label: '🎙️ Técnico de Som',
    items: [
      'Line check e conferência de patch XLR / Stagebox',
      'Coordenação de RF e baterias de microfones / IEM',
      'Alinhamento de PA (FOH) e passagem de som',
      'Salvar cena do show na console + backup no pendrive',
      'Conferência de microfones, garras, DI Box e cabos no load-out',
    ],
  },
  lighting: {
    label: '💡 Iluminação',
    items: [
      'Conferir patch DMX / universos e rede Art-Net / sACN',
      'Teste de Moving Heads, PAR LED, Strobo e Hazer',
      'Focus / posicionamento de presets de palco',
      'Salvar showfile na console (MA2/MA3/Avolites) + backup no pendrive',
      'Desmontagem segura e conferência de cases e garras',
    ],
  },
  video: {
    label: '🎬 Vídeo / Painel LED',
    items: [
      'Conferir cabeamento de sinal (SDI / HDMI / Fibra) e energia do LED',
      'Mapear processadora (Novastar) e testar dead pixels / módulos reserva',
      'Testar resolução, mídia do cliente e timecode no servidor (Resolume/vMix)',
      'Gravação PGM / ISO verificada (espaço em cartão/SSD)',
      'Desmontagem e conferência de placas, cabos e cases',
    ],
  },
  photo: {
    label: '📷 Fotografia',
    items: [
      'Baterias 100% carregadas + cartões SD/CFexpress formatados',
      'Credenciamento / acesso ao fosso e backstage liberado',
      'Checklist de lentes (grande angular, 24-70mm, 70-200mm / prime)',
      'Seleção expressa de fotos para imprensa / redes sociais no evento',
      'Backup duplo (SSD externo + nuvem) pós-show',
    ],
  },
  dj: {
    label: '🎧 DJ / Música',
    items: [
      'Pen drives Rekordbox (Principal + Backup) testados',
      'Conferir link de rede dos CDJs e canais do mixer',
      'Ajustar nível de retorno da cabine (Booth Monitor) sem clipar',
      'Cabos RCA/XLR, adaptador P10/P2 e fone de ouvido conferidos',
      'Guardar equipamentos e conferir cabos ao fim do set',
    ],
  },
  production: {
    label: '📋 Produção / Operação',
    items: [
      'Cronograma de montagem, passagem e abertura alinhado',
      'Logística de chegada, transporte e alimentação definidos',
      'Credenciamento e contato do contratante / responsável local',
      'Registrar horários de entrada e saída (controle de diária / H.E.)',
      'Separar comprovantes de reembolso, anexar NF-e e enviar Fechamento PIX',
    ],
  },
  general: {
    label: '⚡ Kit Básico de Estrada',
    items: [
      'Documento com foto / credencial',
      'Carregador + powerbank',
      'Leatherman / ferramentas + fita gaffer / isolante',
      'Lanterna tática / headlamp',
      'Protetor auricular / IEM',
    ],
  },
};

export function EventChecklist({ items = [], onChange, readOnly = false }) {
  const { primaryHex, categoryId } = useCategoryTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [newText, setNewText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const userTemplateKey = TEMPLATES[categoryId] ? categoryId : 'production';
  const userTemplate = TEMPLATES[userTemplateKey];

  const checked = items.filter(i => i.checked).length;
  const total = items.length;

  const addItem = (text) => {
    if (!text.trim()) return;
    const next = [...items, { id: crypto.randomUUID(), text: text.trim(), checked: false }];
    onChange(next);
    setNewText('');
  };

  const toggleItem = (id) => {
    onChange(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const deleteItem = (id) => {
    onChange(items.filter(i => i.id !== id));
  };

  const applyTemplate = (key) => {
    const existing = new Set(items.map(i => i.text.toLowerCase()));
    const toAdd = TEMPLATES[key].items
      .filter(t => !existing.has(t.toLowerCase()))
      .map(text => ({ id: crypto.randomUUID(), text, checked: false }));
    onChange([...items, ...toAdd]);
    setShowTemplates(false);
  };

  const clearChecked = () => {
    onChange(items.filter(i => !i.checked));
  };

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1f1f1f] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors"
      >
        <ClipboardList className="w-4 h-4 shrink-0" style={{ color: primaryHex }} />
        <span className="font-tag text-[11px] tracking-[2px] uppercase text-[#a8a8a8] flex-1 text-left">Checklist de palco</span>
        {total > 0 && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            checked === total ? 'bg-[#ffd400]/20 text-[#ffd400]' : 'bg-[#2a2a2a] text-[#c8c8c8]'
          }`}>
            {checked}/{total}
          </span>
        )}
        {collapsed ? <ChevronDown className="w-4 h-4 text-[#a8a8a8]" /> : <ChevronUp className="w-4 h-4 text-[#a8a8a8]" />}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Progress bar */}
              {total > 0 && (
                <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ffd400] transition-all duration-300"
                    style={{ width: `${total > 0 ? (checked / total) * 100 : 0}%` }}
                  />
                </div>
              )}

              {/* Items */}
              {items.length === 0 && (
                <div className="text-center py-2.5 space-y-2 border border-dashed border-[#2a2a2a] rounded-lg p-3">
                  <p className="text-xs text-[#a8a8a8]">
                    Carregue seu checklist de palco com 1 toque ou adicione itens abaixo:
                  </p>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => applyTemplate(userTemplateKey)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 border"
                      style={{
                        borderColor: `${primaryHex}66`,
                        color: '#ffffff',
                        backgroundColor: `${primaryHex}28`,
                      }}
                    >
                      Carregar preset {userTemplate.label}
                    </button>
                  )}
                </div>
              )}
              <ul className="space-y-1.5">
                <AnimatePresence>
                  {items.map(item => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="flex items-center gap-2 group"
                    >
                      <button
                        type="button"
                        onClick={() => !readOnly && toggleItem(item.id)}
                        className="shrink-0"
                        disabled={readOnly}
                        aria-label={`${item.checked ? 'Desmarcar' : 'Marcar'}: ${item.text}`}
                      >
                        {item.checked
                          ? <CheckSquare className="w-4 h-4 text-[#ffd400]" />
                          : <Square className="w-4 h-4 text-[#888888]" />
                        }
                      </button>
                      <span className={`text-sm flex-1 ${item.checked ? 'line-through text-[#888888]' : 'text-[#e0e0e0]'}`}>
                        {item.text}
                      </span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-[#888888] hover:text-[#ff2e88]"
                          aria-label={`Remover: ${item.text}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {!readOnly && (
                <>
                  {/* Add item */}
                  <div className="flex gap-2">
                    <Input
                      value={newText}
                      onChange={e => setNewText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(newText); } }}
                      placeholder="Novo item…"
                      aria-label="Novo item do checklist"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addItem(newText)}
                      className="h-8 px-2 border-[#2a2a2a]"
                      aria-label="Adicionar item"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(v => !v)}
                      className="text-xs underline underline-offset-2 bp-hover-primary transition-colors"
                      style={{ color: primaryHex }}
                    >
                      {showTemplates ? 'Fechar templates' : '+ Template rápido'}
                    </button>
                    {checked > 0 && (
                      <button
                        type="button"
                        onClick={clearChecked}
                        className="text-xs text-[#888888] hover:text-[#ff2e88] underline underline-offset-2 ml-auto"
                      >
                        Limpar marcados ({checked})
                      </button>
                    )}
                  </div>

                  {/* Templates */}
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex flex-wrap gap-1.5"
                      >
                        {Object.entries(TEMPLATES).map(([key, tpl]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => applyTemplate(key)}
                            className="text-xs px-2.5 py-1 rounded-full border transition-colors hover:opacity-90"
                            style={{
                              borderColor: `${primaryHex}66`,
                              color: primaryHex,
                              backgroundColor: `${primaryHex}14`,
                            }}
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
