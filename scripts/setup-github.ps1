# ============================================
# Setup GitHub Repository
# Backstage Pro - PWA Project
# ============================================

Write-Host "
╔════════════════════════════════════════════╗
║  SETUP GITHUB REPOSITORY                   ║
║  Backstage Pro - PWA Project                ║
╚════════════════════════════════════════════╝
" -ForegroundColor Cyan

# Verificar se git está instalado
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não está instalado!" -ForegroundColor Red
    Write-Host "Baixe em: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git encontrado" -ForegroundColor Green

# Pedir informações do usuário
Write-Host "`n📝 INFORMAÇÕES NECESSÁRIAS:" -ForegroundColor Cyan

$gitUsername = Read-Host "Seu username do GitHub"
$gitEmail = Read-Host "Seu email do GitHub"
$githubToken = Read-Host "Seu GitHub token (gerado em https://github.com/settings/tokens)" -AsSecureString
$githubTokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($githubToken))

if ([string]::IsNullOrWhiteSpace($gitUsername) -or [string]::IsNullOrWhiteSpace($githubTokenPlain)) {
    Write-Host "❌ Informações incompletas!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Informações recebidas" -ForegroundColor Green

# Configurar git
Write-Host "`n⚙️  Configurando Git..." -ForegroundColor Cyan
git config --global user.name "$gitUsername"
git config --global user.email "$gitEmail"
Write-Host "✅ Git configurado: $gitUsername <$gitEmail>" -ForegroundColor Green

# Verificar se já tem repositório
if (Test-Path ".git") {
    Write-Host "⚠️  Repositório git já existe" -ForegroundColor Yellow
    $continueSetup = Read-Host "Deseja continuar e resetar? (s/n)"
    if ($continueSetup -ne "s") {
        Write-Host "❌ Setup cancelado" -ForegroundColor Red
        exit 1
    }
    git remote remove origin -ErrorAction SilentlyContinue
} else {
    Write-Host "🔧 Inicializando novo repositório git..." -ForegroundColor Cyan
    git init
}

# Adicionar remote
Write-Host "`n🔗 Adicionando repositório remoto..." -ForegroundColor Cyan
$repoUrl = "https://${gitUsername}:${githubTokenPlain}@github.com/${gitUsername}/backstage-pro.git"
git remote add origin $repoUrl
Write-Host "✅ Repositório remoto adicionado" -ForegroundColor Green

# Renomear branch
Write-Host "`n📌 Configurando branch main..." -ForegroundColor Cyan
git branch -M main
Write-Host "✅ Branch renomeado para main" -ForegroundColor Green

# Stage e commit
Write-Host "`n📦 Preparando commit inicial..." -ForegroundColor Cyan
git add .
git commit -m "🚀 Initial commit: Backstage Pro PWA setup" -ErrorAction SilentlyContinue
Write-Host "✅ Commit criado" -ForegroundColor Green

# Push
Write-Host "`n🚀 Enviando para GitHub..." -ForegroundColor Cyan
git push -u origin main
Write-Host "✅ Código enviado para GitHub!" -ForegroundColor Green

Write-Host "
╔════════════════════════════════════════════╗
║  ✅ GITHUB SETUP COMPLETO!                 ║
╚════════════════════════════════════════════╝

Repository URL:
https://github.com/$gitUsername/backstage-pro

Próximo passo:
- Vercel: execute setup-vercel.ps1
- Supabase: execute setup-supabase.ps1
" -ForegroundColor Green
