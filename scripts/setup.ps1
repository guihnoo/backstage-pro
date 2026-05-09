# Setup Simples - Backstage Pro
# GitHub + Vercel + Supabase

Write-Host ""
Write-Host "=============================================="
Write-Host "BACKSTAGE PRO - SETUP SIMPLES"
Write-Host "GitHub + Vercel + Supabase"
Write-Host "=============================================="
Write-Host ""

# Menu
Write-Host "Escolha o que fazer:"
Write-Host ""
Write-Host "1 - Setup Completo (recomendado)"
Write-Host "2 - Setup GitHub apenas"
Write-Host "3 - Setup Vercel apenas"
Write-Host "4 - Setup Supabase apenas"
Write-Host "5 - Sair"
Write-Host ""

$choice = Read-Host "Digite a opcao (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "=========================================="
        Write-Host "PASSO 1: GitHub Setup"
        Write-Host "=========================================="
        Write-Host ""
        Write-Host "Antes de continuar, faca isto:"
        Write-Host ""
        Write-Host "1. Acesse: https://github.com/signup"
        Write-Host "2. Crie conta (use: guihmonteiro.2014@gmail.com)"
        Write-Host "3. Confirme no email"
        Write-Host "4. Acesse: https://github.com/new"
        Write-Host "5. Nome: backstage-pro"
        Write-Host "6. Clique: Create repository"
        Write-Host "7. Acesse: https://github.com/settings/tokens/new"
        Write-Host "8. Nome do token: backstage-pro-dev"
        Write-Host "9. Marque: repo e workflow"
        Write-Host "10. Copie o token gerado"
        Write-Host ""
        Write-Host "Pressione ENTER quando tiver tudo..."
        Read-Host

        Write-Host ""
        Write-Host "Digite seu GitHub username:"
        $gitUsername = Read-Host

        Write-Host "Digite seu email GitHub:"
        $gitEmail = Read-Host

        Write-Host "Cole seu GitHub token:"
        $githubToken = Read-Host

        if ([string]::IsNullOrWhiteSpace($gitUsername) -or [string]::IsNullOrWhiteSpace($githubToken)) {
            Write-Host "ERRO: Dados incompletos!"
            exit 1
        }

        Write-Host ""
        Write-Host "Configurando git..."
        git config --global user.name $gitUsername
        git config --global user.email $gitEmail
        Write-Host "OK - Git configurado"

        Write-Host ""
        Write-Host "Removendo remote antigo..."
        git remote remove origin -ErrorAction SilentlyContinue

        Write-Host "Adicionando remote novo..."
        $repoUrl = "https://${gitUsername}:${githubToken}@github.com/${gitUsername}/backstage-pro.git"
        git remote add origin $repoUrl

        Write-Host "Configurando branch..."
        git branch -M main

        Write-Host "Fazendo commit..."
        git add .
        git commit -m "Initial commit: Backstage Pro PWA" -ErrorAction SilentlyContinue

        Write-Host "Enviando para GitHub..."
        git push -u origin main

        Write-Host ""
        Write-Host "=========================================="
        Write-Host "GitHub OK!"
        Write-Host "Seu repositorio: https://github.com/$gitUsername/backstage-pro"
        Write-Host "=========================================="
        Write-Host ""

        Write-Host "=========================================="
        Write-Host "PASSO 2: Vercel Setup"
        Write-Host "=========================================="
        Write-Host ""
        Write-Host "Faça isto MANUALMENTE:"
        Write-Host ""
        Write-Host "1. Acesse: https://vercel.com/signup"
        Write-Host "2. Clique: Continue with GitHub"
        Write-Host "3. Autorize Vercel"
        Write-Host "4. Seu repositorio deve aparecer"
        Write-Host "5. Clique: Import"
        Write-Host "6. Deixe tudo padrao"
        Write-Host "7. Clique: Deploy"
        Write-Host "8. Espere terminar (2-3 minutos)"
        Write-Host ""
        Write-Host "Seu app estara em: https://backstage-pro.vercel.app"
        Write-Host ""
        Write-Host "Pressione ENTER quando Vercel terminar..."
        Read-Host

        Write-Host ""
        Write-Host "=========================================="
        Write-Host "PASSO 3: Supabase Setup"
        Write-Host "=========================================="
        Write-Host ""
        Write-Host "Faça isto MANUALMENTE:"
        Write-Host ""
        Write-Host "1. Acesse: https://supabase.com"
        Write-Host "2. Clique: Start your project"
        Write-Host "3. Clique: Sign up with GitHub"
        Write-Host "4. Autorize Supabase"
        Write-Host "5. New Project"
        Write-Host "6. Name: backstage-pro"
        Write-Host "7. Database Password: [escolha algo forte]"
        Write-Host "8. Region: us-east-1"
        Write-Host "9. Plan: Free"
        Write-Host "10. Create Project"
        Write-Host "11. Espere 2-3 minutos"
        Write-Host ""
        Write-Host "IMPORTANTE:"
        Write-Host "Copie seu Project URL e Anon Key"
        Write-Host ""
        Write-Host "Depois edite o arquivo .env.local:"
        Write-Host "VITE_SUPABASE_URL=seu-project-url"
        Write-Host "VITE_SUPABASE_ANON_KEY=sua-anon-key"
        Write-Host ""
        Write-Host "Pressione ENTER quando terminar..."
        Read-Host

        Write-Host ""
        Write-Host "=========================================="
        Write-Host "Setup COMPLETO!"
        Write-Host "=========================================="
        Write-Host ""
        Write-Host "GitHub: https://github.com/$gitUsername/backstage-pro"
        Write-Host "Vercel: https://backstage-pro.vercel.app"
        Write-Host "Supabase: https://supabase.com/dashboard"
        Write-Host ""
        Write-Host "Proximo: execute npm install"
        Write-Host "Depois: npm run dev"
        Write-Host ""
    }

    "2" {
        Write-Host "GitHub setup..."
        Write-Host ""
        Write-Host "1. Acesse: https://github.com/signup"
        Write-Host "2. Crie conta"
        Write-Host "3. Acesse: https://github.com/new"
        Write-Host "4. Name: backstage-pro"
        Write-Host "5. Create"
        Write-Host ""
        Write-Host "Depois: gere token em https://github.com/settings/tokens/new"
    }

    "3" {
        Write-Host "Vercel setup manual em: https://vercel.com/signup"
    }

    "4" {
        Write-Host "Supabase setup manual em: https://supabase.com"
    }

    "5" {
        Write-Host "Saindo..."
        exit 0
    }

    default {
        Write-Host "Opcao invalida"
        exit 1
    }
}
