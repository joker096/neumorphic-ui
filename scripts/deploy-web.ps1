param(
  [string]$Server = "prod",
  [string]$RemotePath = "/var/www/mess.cvr.name",
  [string]$ProjectPath = "",
  [switch]$SkipWebBuild,
  [switch]$Help
)

$ErrorActionPreference = "Stop"
$RootDir = if ($ProjectPath) { $ProjectPath } else { Resolve-Path "$PSScriptRoot/.." }

if ($Help) {
  Write-Host @"
Mess&Anger — Web Deploy Script
Builds the web PWA and deploys to the server via SSH.

USAGE:
  .\scripts\deploy-web.ps1 [options]

OPTIONS:
  -Server        SSH host (from ~/.ssh/config or user@host) (default: prod)
  -RemotePath    Remote web root (default: /var/www/mess.cvr.name)
  -SkipWebBuild  Skip running npm run build
  -Help          Show this help

REQUIREMENTS:
  - SSH access configured (~/.ssh/config)
  - Write access to remote web root
"@
  exit 0
}

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Mess&Anger — Web Deploy              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan

if (-not $SkipWebBuild) {
  Write-Host "[1/3] Building web PWA..." -ForegroundColor Yellow
  Push-Location $RootDir
  try { npm run build } finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw "Web build failed" }
  Write-Host "  ✓ Build complete" -ForegroundColor Green
}

$AdminDist = "$RootDir/dist/admin"
if (Test-Path $AdminDist) {
  Write-Host "  Including admin panel from dist/admin..." -ForegroundColor Gray
}

Write-Host "[2/3] Deploying to $Server`:$RemotePath..." -ForegroundColor Yellow
Push-Location "$RootDir/dist"
try {
  ssh $Server "mkdir -p $RemotePath/admin" 2>&1 | Out-Null
  tar cf - . | ssh $Server "tar xf - -C $RemotePath"
  if ($LASTEXITCODE -ne 0) { throw "Deploy failed" }
} finally { Pop-Location }
Write-Host "  ✓ Deploy complete" -ForegroundColor Green

Write-Host "[3/3] Post-deploy checks..." -ForegroundColor Yellow
$status = ssh $Server "curl -s -o /dev/null -w '%{http_code}' https://mess.cvr.name/" 2>&1
if ($status -eq "200") {
  Write-Host "  ✓ Site responding: HTTPS 200" -ForegroundColor Green
} else {
  Write-Host "  ⚠ Site status: $status" -ForegroundColor Yellow
}

$size = ssh $Server "du -sh $RemotePath | cut -f1" 2>&1
Write-Host "  Remote size: $size" -ForegroundColor Gray
Write-Host "`n✓ Deployment complete!" -ForegroundColor Green
