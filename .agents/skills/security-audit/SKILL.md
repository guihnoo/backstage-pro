---
name: security-audit
description: >
  Auditoria de segurança, busca de credenciais vazadas, verificação de brechas
  em dependências npm e teste de regras de RLS no Supabase.
---

# Security Audit — Hacker de Cibersegurança & Pentester

Esta skill orienta os agentes na identificação de brechas, vazamento de chaves e inconsistências de segurança no código.

## Checklist de Segurança

1. **Auditoria de Dependências**:
   ```bash
   npm audit --audit-level=high
   ```
2. **Auditoria de Segredos e Chaves**:
   - Nunca commitar `.env`, `.env.local` ou `client_secret*.json`.
   - Garantir que `.gitignore` contém as entradas obrigatórias.
3. **Auditoria de RLS no Banco**:
   - Todas as tabelas no Supabase devem ter `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`.
   - Políticas devem validar `auth.uid() = user_id`.
