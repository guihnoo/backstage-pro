# ============================================
# Backstage Pro - Complete Setup Script
# GitHub + Vercel + Supabase
# ============================================

Write-Host "
╔══════════════════════════════════════════════════════╗
║   BACKSTAGE PRO - COMPLETE SETUP                     ║
║   GitHub + Vercel + Supabase                         ║
╚══════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# Menu
Write-Host "
Escolha o que quer fazer:

1. ⚙️  Setup Completo (GitHub + Vercel + Supabase)
2. 🐙 Setup GitHub Only
3. 🚀 Setup Vercel Only
4. 🗄️  Setup Supabase Only
5. ℹ️  Mostrar Instruções
6. ❌ Sair
" -ForegroundColor Yellow

$choice = Read-Host "Escolha uma opção (1-6)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Iniciando setup completo..." -ForegroundColor Cyan

        # GitHub
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "PASSO 1: GitHub Setup" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

        Write-Host "`nAntes de continuar, você precisa:
1. Criar conta em https://github.com (se não tiver)
2. Criar repositório em https://github.com/new
   - Nome: backstage-pro
   - Deixar empty (sem readme)
3. Gerar token em https://github.com/settings/tokens/new
   - Escopo: repo, workflow
   - Salvar o token

Pressione ENTER quando tiver tudo pronto..." -ForegroundColor Yellow
        Read-Host

        & "$PSScriptRoot\setup-github.ps1"

        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n❌ GitHub setup falhou" -ForegroundColor Red
            exit 1
        }

        # Vercel
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "PASSO 2: Vercel Setup" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

        Write-Host "`nPróximos passos MANUAIS no Vercel:

1. Acesse: https://vercel.com/signup
2. Clique em 'Continue with GitHub'
3. Autorize Vercel
4. Seu repositório deve aparecer
5. Clique em 'Import'
6. Deixar settings padrão
7. Clique em 'Deploy'

Espere o deploy terminar (~3 minutos)

Pressione ENTER quando o deploy terminar..." -ForegroundColor Yellow
        Read-Host

        Write-Host "✅ Vercel setup manual concluído" -ForegroundColor Green

        # Supabase
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "PASSO 3: Supabase Setup" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

        Write-Host "`nVer instruções detalhadas em:
📄 docs/SUPABASE_SETUP.md

Passos rápidos:
1. https://supabase.com → Sign up with GitHub
2. New Project → backstage-pro
3. Database Password: [escolha forte]
4. Region: us-east-1
5. Plan: Free
6. Create Project (espere 2-3 min)
7. Copie: Project URL e Anon Key
8. Edit .env.local com essas credenciais

Pressione ENTER quando tiver as credenciais..." -ForegroundColor Yellow
        Read-Host

        Write-Host "
🎉 Setup concluído! Resumo:

✅ GitHub: https://github.com/seu-usuario/backstage-pro
✅ Vercel: Deploy automático ativado
✅ Supabase: Banco de dados pronto

Próximo passo:
npm install
npm run dev

Seu projeto está pronto para desenvolvimento! 🚀
" -ForegroundColor Green
    }

    "2" {
        Write-Host "`n🐙 GitHub Setup..." -ForegroundColor Cyan
        & "$PSScriptRoot\setup-github.ps1"
    }

    "3" {
        Write-Host "`n🚀 Vercel Setup Instructions" -ForegroundColor Cyan
        Write-Host "
Vercel Setup (Manual):
1. https://vercel.com/signup
2. Continue with GitHub
3. Import backstage-pro
4. Deploy

Docs: https://vercel.com/docs
" -ForegroundColor Yellow
    }

    "4" {
        Write-Host "`n🗄️  Supabase Setup Instructions" -ForegroundColor Cyan
        Write-Host "Ver: docs/SUPABASE_SETUP.md" -ForegroundColor Yellow
        Get-Content "$PSScriptRoot\..\docs\SUPABASE_SETUP.md" | Select-Object -First 50
    }

    "5" {
        Write-Host "
📖 INSTRUÇÕES COMPLETAS

1. GITHUB (https://github.com/signup)
   └─ Criar conta + repositório backstage-pro
   └─ Gerar token em settings/tokens
   └─ Execute: $PSScriptRoot\setup-github.ps1

2. VERCEL (https://vercel.com/signup)
   └─ Sign up com GitHub
   └─ Import backstage-pro
   └─ Deploy automático
   └─ Adicionar env vars (Supabase)

3. SUPABASE (https://supabase.com/signup)
   └─ Sign up com GitHub
   └─ Create new project
   └─ Copy credenciais
   └─ Edit .env.local
   └─ Add env vars em Vercel

📚 Documentação:
   └─ GitHub: https://docs.github.com
   └─ Vercel: https://vercel.com/docs
   └─ Supabase: https://supabase.com/docs
" -ForegroundColor Yellow
    }

    "6" {
        Write-Host "Saindo..." -ForegroundColor Yellow
        exit 0
    }

    default {
        Write-Host "❌ Opção inválida" -ForegroundColor Red
        exit 1
    }
}
