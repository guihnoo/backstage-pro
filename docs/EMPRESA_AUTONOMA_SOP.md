# 🏢 Manual Operacional da Software House Autônoma (SOP)

Este documento define a arquitetura, organograma de colaboradores e fluxos de automação da nossa Software House, conectando o **WhatsApp** via **n8n (Hostinger)**, **GitHub** e os **Agentes Especializados do Antigravity**.

---

## 1. Organograma dos Colaboradores (Subagentes Ativos)

| Cargo | Subagente | Responsabilidade | Ferramentas |
| :--- | :--- | :--- | :--- |
| **Tech Lead & PM** | `tech-lead` | Arquitetura, PRDs, specs técnicas e quebra de tarefas | MetaGPT, GitHub Issues |
| **Frontend Dev & UI** | `frontend-dev` | Telas React, Tailwind CSS, All Access (#ffd400), PWA | Vite, Framer Motion, Shadcn |
| **Hacker de QA & Sec** | `qa-security-hacker` | Caça de bugs, console clean, testes 4G, pentest | Playwright Pro, Browser-Use |
| **Engenheiro DBA** | `database-engineer`| Migrations SQL, RLS policies, schemas PostgreSQL | Supabase CLI, Postgres MCP |

---

## 2. Fluxo de Trabalho: Do WhatsApp à Produção

```
                    [VOCÊ NO WHATSAPP]
                            │
                            ▼
              ┌───────────────────────────┐
              │     n8n (Hostinger 24/7)  │
              │  - Webhook WhatsApp       │
              │  - Transcrição de áudio   │
              │  - Análise com IA         │
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │       GITHUB ISSUES       │
              │  - Cria Issue no repo     │
              │  - Label: [ready-for-dev] │
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │   ANTIGRAVITY / AGENTES   │
              │  - Lê a Issue             │
              │  - Frontend Dev programa  │
              │  - QA Hacker testa (PW)   │
              │  - Build de produção (Vite)│
              │  - Commit & Push no Git   │
              └─────────────┬─────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │  NOTIFICAÇÃO NO WHATSAPP  │
              │  "Chefe, tarefa concluída!│
              │  Build OK e testes 100%!" │
              └───────────────────────────┘
```

---

## 3. Como Configurar no seu n8n (Hostinger)

### Passo A: Conectar o WhatsApp ao n8n
Você pode usar uma das opções gratuitas / open source conectadas ao seu n8n:
1. **Evolution API** ou **WAHA (WhatsApp HTTP API)**:
   - Rodando em container Docker na Hostinger ou VPS.
   - Envia um Webhook para o n8n toda vez que você mandar mensagem no número da empresa.
2. **WhatsApp Cloud API (Oficial da Meta)**:
   - Gratuita para até 1.000 mensagens/mês.
   - Nó nativo no n8n.

### Passo B: Nó de Processamento no n8n
1. **Trigger**: Webhook do WhatsApp (recebe a mensagem ou áudio).
2. **AI Agent (n8n)**:
   - Modelo: OpenAI / Gemini / Claude.
   - Prompt: *"Você é a secretária executiva da Software House. Analise o pedido do Diretor, identifique o projeto alvo (ex: Backstage Pro) e formate uma Issue com título claro e critérios de aceite."*
3. **Nó do GitHub (Create Issue)**:
   - Repositório: `guihnoo/backstage-pro`
   - Título: `[AUTO-TASK] {{ $json.task_title }}`
   - Corpo: `{{ $json.task_description }}`
   - Labels: `status:pending`, `agent:antigravity`
4. **Nó de Retorno do WhatsApp**:
   - Envia confirmação imediata para você:
     *`"Recebido, Diretor! Já abri a tarefa no GitHub (#{{ $json.issue_number }}) e a equipe de desenvolvimento já está atuando."`*

---

## 4. Como os Agentes do Antigravity Executam a Tarefa

1. O **Tech Lead** (`tech-lead`) valida os requisitos e instrui o time.
2. O **Frontend Dev** (`frontend-dev`) faz as alterações nas páginas (`src/pages/`) seguindo o design All Access.
3. O **Hacker de QA** (`qa-security-hacker`) roda os testes automatizados do Playwright:
   ```bash
   npx playwright test e2e/regression/console-clean.spec.js
   npm run build
   ```
4. Com tudo aprovado, o commit de entrega é realizado e o webhook de conclusão avisa o seu n8n para enviar o relatório final no seu WhatsApp.
