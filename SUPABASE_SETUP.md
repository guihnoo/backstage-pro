# Configuração do Supabase

Este guia explica como configurar o Supabase para o Backstage Pro.

## Passo 1: Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project" 
3. Preencha os dados:
   - **Organization**: `guihnoo` (ou sua organização)
   - **Project name**: `backstage-pro`
   - **Region**: `South America (São Paulo)` (sa-east-1)
   - **Database Password**: crie uma senha segura
4. Habilite as opções:
   - ✅ Enable Data API
   - ✅ Enable automatic RLS
5. Clique em "Create new project" e aguarde (~3 minutos)

## Passo 2: Copiar Credenciais

Após o projeto ser criado:

1. Clique em "Settings" (ícone de engrenagem)
2. Vá em "API" na barra lateral
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`

4. Abra o arquivo `.env.local` neste repositório
5. Cole os valores:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## Passo 3: Habilitar Autenticação OAuth

No dashboard Supabase:

1. Vá em "Authentication" → "Providers"
2. **Google**:
   - Habilite (clique no toggle)
   - Copie o "Redirect URL" que aparecerá
   - Configure em [Google Cloud Console](https://console.cloud.google.com)
   - Cole Client ID e Client Secret no Supabase

3. **Discord** (opcional):
   - Habilite
   - Configure em [Discord Developer Portal](https://discord.com/developers/applications)

4. **Facebook** (opcional):
   - Habilite
   - Configure em [Facebook Developers](https://developers.facebook.com)

5. **Apple** (opcional):
   - Habilite
   - Configure em [Apple Developer](https://developer.apple.com)

> Dica: Comece com Google. Os outros podem ser adicionados depois.

## Passo 4: Executar Migrations

No dashboard Supabase, vá em "SQL Editor" e:

1. Cole o conteúdo de cada arquivo em `supabase/migrations/`:
   - `001_profiles.sql`
   - `002_events.sql`
   - `003_clients.sql`
   - `004_expenses.sql`
   - `005_daily_work.sql`
   - `006_user_settings.sql`

2. Execute cada uma clicando em "Run"

Ou use o Supabase CLI:
```bash
supabase link --project-ref xxxxx
supabase db push
```

## Passo 5: Testar

1. Volte ao app
2. Acesse `http://localhost:5173`
3. Clique em "Bem-vindo" → "Google"
4. Faça login com sua conta Google
5. Complete o onboarding
6. Você deve chegar no dashboard

## Variáveis de Ambiente

```
# .env.local

# Supabase (copie do dashboard)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## Checklist Final

- [ ] Projeto Supabase criado
- [ ] URL e Anon Key no `.env.local`
- [ ] OAuth Google habilitado
- [ ] Migrations executadas (6 tabelas criadas)
- [ ] App consegue fazer login
- [ ] Dados salvos na tabela `profiles`
- [ ] Logout funciona

## Próximos Passos

Após confirmação de que tudo está funcionando:

1. Implementar dashboard real com dados do Supabase
2. Criar páginas de CRUD (eventos, clientes, despesas)
3. Adicionar relatórios e estatísticas
4. Implementar notificações

## Suporte

Se encontrar erros:

1. Verifique se as credenciais estão corretas no `.env.local`
2. Confirme que as migrations foram executadas
3. Revise o console do browser (F12) para erros
4. Verifique os logs do Supabase no SQL Editor

---

**Nota**: A RLS (Row Level Security) garante que cada usuário só acessa seus próprios dados. Nenhuma mudança manual de SQL é necessária — está configurado automaticamente nas migrations.
