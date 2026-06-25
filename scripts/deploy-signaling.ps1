param(
  [string]$Server = "prod",
  [string]$ProjectPath = "",
  [switch]$Help
)

$ErrorActionPreference = "Stop"
$RootDir = if ($ProjectPath) { $ProjectPath } else { Resolve-Path "$PSScriptRoot/.." }

if ($Help) {
  Write-Host @"
Mess&Anger — Signaling Server Deploy
Deploys and starts the signaling server on the remote server via SSH.

USAGE:
  .\scripts\deploy-signaling.ps1 [options]

OPTIONS:
  -Server        SSH host (default: prod)
  -Help          Show this help

REQUIREMENTS:
  - SSH access to server
  - Node.js + npm on server
  - PM2 on server
"@
  exit 0
}

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Mess&Anger — Signaling Deploy            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "[1/4] Uploading server files..." -ForegroundColor Yellow
ssh $Server "mkdir -p /home/user0/messanger/server"

# Upload package.json
scp "$RootDir/package.json" "${Server}:/home/user0/messanger/package.json" 2>&1 | Out-Null
scp "$RootDir/server/signaling-server.ts" "${Server}:/home/user0/messanger/server/signaling-server.ts" 2>&1 | Out-Null

Write-Host "[2/4] Installing dependencies..." -ForegroundColor Yellow
ssh $Server "cd /home/user0/messanger && npm install --omit=dev 2>&1 | tail -3"

Write-Host "[3/4] Starting signaling server..." -ForegroundColor Yellow
ssh $Server "cd /home/user0/messanger && pm2 start server/signaling-server.ts --name mess-signaling --interpreter npx --interpreter-args tsx -- --port 3006 2>&1"

Write-Host "[4/4] Verifying..." -ForegroundColor Yellow
$status = ssh $Server "pm2 list 2>&1 | grep mess-signaling | grep online"
if ($status) {
  Write-Host "  ✓ Signaling server online" -ForegroundColor Green
} else {
  Write-Host "  ⚠ Check PM2 status" -ForegroundColor Yellow
}

ssh $Server "pm2 save" 2>&1 | Out-Null
Write-Host "✓ Done! Signaling server: wss://mess.cvr.name/ws" -ForegroundColor Green
