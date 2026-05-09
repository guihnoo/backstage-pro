# ⚡ QUICKSTART - Comece em 5 minutos

## 🎯 Objetivo
Ter seu projeto rodando com GitHub + Vercel + Supabase

---

## 📋 Checklist (Execute na ordem)

### 1️⃣ GitHub (5 min)
```
[ ] Ir para https://github.com/signup
[ ] Criar conta (ou usar existente)
[ ] Ir para https://github.com/settings/tokens/new
[ ] Gerar token (escopo: repo, workflow)
[ ] Executar: .\scripts\setup-github.ps1
[ ] Colar username, email, e token
[ ] ✅ Código enviado para GitHub
```

**Links:**
- Signup: https://github.com/signup
- Token: https://github.com/settings/tokens/new
- Seu repo: https://github.com/seu-usuario/backstage-pro

---

### 2️⃣ Vercel (5 min)
```
[ ] Ir para https://vercel.com/signup
[ ] Clique: "Continue with GitHub"
[ ] Autorizar Vercel
[ ] New Project → backstage-pro
[ ] Clique: Import
[ ] Clique: Deploy
[ ] Esperar deploy (2-3 min)
[ ] ✅ App rodando em vercel.app
```

**Links:**
- Signup: https://vercel.com/signup
- Dashboard: https://vercel.com/dashboard
- Seu app: https://backstage-pro.vercel.app

---

### 3️⃣ Supabase (5 min)
```
[ ] Ir para https://supabase.com
[ ] Clique: "Start your project"
[ ] Sign up with GitHub
[ ] New Project → backstage-pro
[ ] Password: [escolha forte]
[ ] Region: us-east-1
[ ] Plan: Free
[ ] Criar projeto (2-3 min)
[ ] Copiar: Project URL e Anon Key
[ ] Editar .env.local
[ ] ✅ Banco de dados pronto
```

**Links:**
- Website: https://supabase.com
- Dashboard: https://supabase.com/dashboard
- Seu projeto: https://app.supabase.com (após criar)

---

## 🔑 Credenciais Necessárias

Salve em um lugar seguro:

```
GitHub:
├─ Username: seu-usuario
├─ Email: seu@email.com
└─ Token: ghp_xxxxx...

Supabase:
├─ Project URL: https://xxxxx.supabase.co
├─ Anon Key: eyJhbGc...
└─ Database Password: [password seguro]

Vercel:
└─ Já conectado via GitHub
```

---

## 📝 Variáveis de Ambiente

Edite `.env.local` (na raiz do projeto):

```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 🧪 Testes Finais

Verifique se tudo funciona:

```powershell
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Check files
npm run lint

# Browser: 
# http://localhost:5173
```

**Deve ver:**
- ✅ App carregando
- ✅ Sem erros no console
- ✅ Sem eslint errors

---

## 🚀 Deploy Automático

Agora, toda vez que fizer:

```powershell
git push
```

**Automaticamente:**
1. GitHub recebe seu código
2. Vercel detecta mudança
3. Vercel faz build
4. Vercel deploya novo site
5. Em 2-3 minutos: seu app atualizado online 🎉

---

## 📊 Resumo dos Links

| Serviço | Link | Status |
|---------|------|--------|
| GitHub | https://github.com/seu-usuario/backstage-pro | Code |
| Vercel | https://backstage-pro.vercel.app | App |
| Supabase | https://app.supabase.com | Database |

---

## ⚠️ Importante

1. **`.env.local` é privado**
   - Nunca commit no GitHub
   - Nunca compartilhe com ninguém
   - Já está no `.gitignore`

2. **Tokens e senhas**
   - Guarde em password manager
   - Não deixe no código
   - Regenere se vazar

3. **Vercel variáveis**
   - Adicione em Vercel Settings
   - Não em .env.local
   - Vercel vai usar para produção

---

## 🎓 Próximos Passos

Depois de tudo rodando:

1. **Testar PWA**
   - F12 → Application → Manifest
   - Deve ver seu PWA configurado

2. **Refatorar código**
   - Ver: `EXEMPLOS_REFATORACAO.md`
   - Começar por React Router v7

3. **Conectar Supabase**
   - Criar tabelas
   - Conectar ao app
   - Migrar dados de Base44

---

## 📞 Ajuda Rápida

| Problema | Solução |
|----------|---------|
| Git não funciona | Instale em git-scm.com |
| Token inválido | Gere novo em github.com/settings/tokens |
| Deploy falha | Ver logs em vercel.com/dashboard |
| App não carrega | Limpe cache (Ctrl+Shift+Delete) |
| Env vars não funcionam | Redeploy no Vercel |

---

## ✨ Dicas Profissionais

1. Use commits descritivos
   ```
   git commit -m "✨ feature: adicionar login"
   git commit -m "🐛 fix: corrigir erro de cache"
   git commit -m "♻️ refactor: melhorar performance"
   ```

2. Antes de push, sempre teste:
   ```
   npm run lint    # Verificar código
   npm run dev     # Testar localmente
   git status      # Ver mudanças
   ```

3. Crie branches para features:
   ```
   git checkout -b feature/nova-funcionalidade
   ```

---

## 🎯 Você está pronto!

Parabéns! Seu setup está completo:
- ✅ Código versionado (GitHub)
- ✅ Deploy automático (Vercel)
- ✅ Banco de dados (Supabase)
- ✅ PWA configurado

**Próximo:** `npm run dev` e comece a codar! 🚀

