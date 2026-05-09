# 🗄️ Supabase Setup Guide

## Objetivo
Configurar banco de dados PostgreSQL na nuvem com Supabase.

---

## 1️⃣ Criar Conta Supabase

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. **Sign up com GitHub** (mais fácil):
   - Clique em "Continue with GitHub"
   - Autorize Supabase a acessar sua conta

---

## 2️⃣ Criar Projeto

1. Dashboard → **"New project"**
2. Preencha:
   - **Name:** `backstage-pro`
   - **Database Password:** [escolha uma FORTE e SALVE]
   - **Region:** `us-east-1` (ou mais perto)
   - **Pricing Plan:** `Free` ✅

3. Clique em **"Create new project"**

⏳ Espere 2-3 minutos...

---

## 3️⃣ Copiar Credenciais

Quando terminar, você verá:

```
Project Settings
├─ Project URL: https://xxxxx.supabase.co
├─ Anon Key: eyJhbGc...
└─ Service Role Key: eyJhbGc...
```

**COPIE ESTES 3 VALORES:**
- Project URL
- Anon Key
- Service Role Key

---

## 4️⃣ Configurar no .env.local

Edite o arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 5️⃣ Configurar em Vercel

1. Dashboard Vercel → seu projeto
2. **Settings** → **Environment Variables**
3. Adicione:

```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
```

4. Save & redeploy

---

## 6️⃣ Conectar no App (Opcional)

Se quiser usar Supabase no seu app React:

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

Depois use em qualquer componente:

```javascript
import { supabase } from '@/lib/supabase'

// Exemplo: buscar dados
const { data, error } = await supabase
  .from('events')
  .select('*')
```

---

## ✅ Testes

Vá para o Supabase Dashboard:

1. **SQL Editor** → crie uma tabela de teste
2. Insira alguns dados
3. Seu app pode buscar esses dados agora!

---

## 🔐 Segurança

- **Anon Key** = usar no frontend (pública)
- **Service Role Key** = usar no backend (privada!)
- **Database Password** = nunca compartilhar!

---

## 📚 Mais Informações

- Docs: https://supabase.com/docs
- API: https://supabase.com/docs/reference/javascript
- Exemplos: https://github.com/supabase/supabase/tree/master/examples

