# Aplica site_url e redirect URLs do config.toml no projeto Supabase na nuvem.
# Pré-requisito: supabase login (uma vez) OU variável SUPABASE_ACCESS_TOKEN
# Uso: npm run supabase:auth-push

$ErrorActionPreference = "Stop"
$ProjectRef = "cwtallnetgodoacuoaow"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ">> Enviando auth config para projeto $ProjectRef ..."
npx --yes supabase@latest config push --project-ref $ProjectRef --yes
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Falhou. Rode antes: npx supabase login"
  Write-Host "Ou defina SUPABASE_ACCESS_TOKEN (PAT em https://supabase.com/dashboard/account/tokens)"
  exit 1
}
Write-Host ">> Auth URLs atualizadas na nuvem."
