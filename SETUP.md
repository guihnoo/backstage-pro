# 🚀 BACKSTAGE PRO - Setup Completo

> Guia para setup do projeto: GitHub + Vercel + Supabase

---

## 📋 Pré-requisitos

- ✅ Node.js 16+ instalado
- ✅ Git instalado
- ✅ Conta Google/GitHub (para criar contas)
- ✅ ~30 minutos do seu tempo

---

## ⚡ Setup Rápido (3 passos)

### 1. Instalar dependências

```powershell
cd "C:\Users\monte\OneDrive\Documentos\backstage-pro"
npm install
```

### 2. Executar script de setup

```powershell
cd scripts
.\setup-all.ps1
```

Siga o menu e escolha uma das opções.

### 3. Adicionar credenciais

Edite `.env.local` com suas credenciais do Supabase:

```bash
VITE_SUPABASE_URL=seu-project.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

---

## 📖 Instruções Detalhadas

### 🐙 GITHUB SETUP

#### O que é
Versionamento de código e backup na nuvem.

#### Passo a Passo

1. **Criar conta** (se não tiver)
   - Acesse: https://github.com/signup
   - Use email: `guihmonteiro.2014@gmail.com`
   - Confirme no email

2. **Criar repositório**
   - Acesse: https://github.com/new
   - Nome: `backstage-pro`
   - Descrição: "PWA for event and financial management"
   - Deixe público (ou privado se preferir)
   - **NÃO marque** "Initialize with README"
   - Clique **Create repository**

3. **Gerar token de acesso**
   - Acesse: https://github.com/settings/tokens/new
   - **Token name:** `backstage-pro-local-dev`
   - **Expiration:** 90 days
   - **Scopes:** selecione `repo` e `workflow`
   - Clique **Generate token**
   - **COPIE O TOKEN** (aparece só uma vez!)

4. **Executar script**
   ```powershell
   cd scripts
   .\setup-github.ps1
   ```
   - Digite seu username do GitHub
   - Digite seu email do GitHub
   - Cole o token que acabou de copiar
   - Script faz o resto automaticamente! ✨

#### Verificação
- Acesse: https://github.com/seu-usuario/backstage-pro
- Deve ver seu código lá ✅

---

### 🚀 VERCEL SETUP

#### O que é
Deploy automático - toda vez que você faz `git push`, seu app é atualizado em produção.

#### Passo a Passo

1. **Criar conta**
   - Acesse: https://vercel.com/signup
   - Clique em **"Continue with GitHub"**
   - Autorize Vercel a acessar sua conta

2. **Importar projeto**
   - Dashboard do Vercel
   - Clique em **"New Project"**
   - Seu repositório `backstage-pro` deve aparecer
   - Clique em **"Import"**

3. **Configurar ambiente**
   - Build Command: (deixar padrão)
   - Install Command: (deixar padrão)
   - Output Directory: `dist`
   - Clique em **"Deploy"**

4. **Esperar deploy** (2-3 minutos)

#### Adicionar Variáveis de Ambiente

Depois que Supabase estiver pronto:

1. Dashboard Vercel → seu projeto
2. **Settings** → **Environment Variables**
3. Adicione:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGc...
   ```
4. Clique **Save**

#### Verificação
- Acesse: https://backstage-pro.vercel.app
- Deve carregar o app ✅

---

### 🗄️ SUPABASE SETUP

#### O que é
Banco de dados PostgreSQL na nuvem (incluso: autenticação, storage, etc).

#### Passo a Passo

1. **Criar conta**
   - Acesse: https://supabase.com
   - Clique em **"Start your project"**
   - **Sign up with GitHub**
   - Autorize Supabase

2. **Criar projeto**
   - Dashboard → **"New project"**
   - **Name:** `backstage-pro`
   - **Database Password:** [escolha FORTE, salve em lugar seguro]
   - **Region:** `us-east-1` (ou seu país)
   - **Plan:** `Free` ✅
   - Clique **"Create new project"**

3. **Esperar criação** (2-3 minutos)

4. **Copiar credenciais**
   - Procure por:
     - Project URL (ex: `https://xxxxx.supabase.co`)
     - Anon Key (ex: `eyJhbGc...`)
   - **COPIE OS DOIS VALORES**

5. **Editar .env.local**
   ```bash
   # .env.local
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

6. **Adicionar em Vercel** (quando tiver os valores)
   - Vercel Dashboard → Settings → Environment Variables
   - Mesmos valores acima

#### Verificação
- Dashboard Supabase → vá em "SQL Editor"
- Vá em "Postgres" se conseguir acessar ✅

---

## 🔄 Fluxo de Desenvolvimento

Depois de tudo configurado:

```powershell
# 1. Fazer mudanças no código
# ...editar arquivos...

# 2. Testar localmente
npm run dev

# 3. Quando tudo funcionar, commit
git add .
git commit -m "✨ feature: descrição da mudança"

# 4. Push para GitHub (automático envia para Vercel)
git push

# 5. Pronto! Seu app está atualizado em produção 🎉
```

---

## 📁 Estrutura de Pastas Importante

```
backstage-pro/
├── .env.local              ← Suas credenciais (gitignored)
├── .env.example            ← Template (versionado)
├── scripts/
│   ├── setup-all.ps1       ← Menu de setup
│   └── setup-github.ps1    ← Setup GitHub automático
├── docs/
│   └── SUPABASE_SETUP.md   ← Instruções Supabase
├── vercel.json             ← Configuração Vercel
└── ...resto do projeto
```

---

## 🆘 Troubleshooting

### "Git command not found"
- Instale Git: https://git-scm.com/download/win
- Reinicie o PowerShell

### "Cannot read property 'xxx' of undefined"
- Certifique-se que `.env.local` existe
- Verifique os valores do Supabase

### "Vercel deploy falha"
- Vá para Vercel Dashboard → seu projeto → Deployments
- Veja os logs do erro
- Geralmente é variável de ambiente faltando

### "Service Worker não aparece"
- Limpe cache do navegador (Ctrl+Shift+Delete)
- Espere 1-2 minutos (Vercel cache)
- Recarregue a página

---

## ✅ Checklist Final

Após tudo pronto, verifique:

- [ ] Repositório GitHub tem seu código
- [ ] Vercel mostra "Ready" no último deploy
- [ ] `https://backstage-pro.vercel.app` funciona
- [ ] `.env.local` tem credenciais Supabase
- [ ] Supabase Dashboard mostra seu projeto
- [ ] `npm run dev` inicia sem erros

---

## 📞 Próximas Ações

Agora que tem setup pronto:

1. **Refactoring** (3-4 dias)
   - Implementar React Router v7
   - Quebrar Calendar.jsx
   - Ver: `EXEMPLOS_REFATORACAO.md`

2. **Banco de Dados** (1 semana)
   - Migrar de Base44 para Supabase
   - Criar tabelas necessárias
   - Conectar app ao Supabase

3. **Features** (2 semanas)
   - Notificações push
   - Offline sync
   - Analytics

---

## 📚 Recursos

- **GitHub:** https://docs.github.com
- **Vercel:** https://vercel.com/docs
- **Supabase:** https://supabase.com/docs
- **Git:** https://git-scm.com/doc
- **Node.js:** https://nodejs.org/docs

---

## 🎓 Dicas Importantes

1. **Guarde seus tokens em lugar seguro** (password manager)
2. **Nunca commite .env.local** (está no .gitignore)
3. **Use passwords fortes** para banco de dados
4. **Revise logs de erro** quando algo falha

---

**Status:** ✅ Tudo pronto para começar!  
**Próximo passo:** Execute `scripts\setup-all.ps1`  
**Tempo estimado:** 30 minutos

Good luck! 🚀

