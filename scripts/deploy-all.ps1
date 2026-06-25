param(
  [string]$Server = "prod",
  [string]$RemotePath = "/var/www/mess.cvr.name",
  [switch]$SkipWebDeploy,
  [switch]$SkipAndroid,
  [switch]$Help
)

$ErrorActionPreference = "Stop"
$RootDir = Resolve-Path "$PSScriptRoot/.."

if ($Help) {
  Write-Host @"
Mess&Anger — Full Deploy Script
Builds web PWA, deploys to server, and builds Android APK/AAB.

USAGE:
  .\scripts\deploy-all.ps1 [options]

OPTIONS:
  -Server        SSH host (default: prod)
  -RemotePath    Remote web root (default: /var/www/mess.cvr.name)
  -SkipWebDeploy Skip web deploy (APK only)
  -SkipAndroid   Skip Android build (web deploy only)
  -Help          Show this help
"@
  exit 0
}

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Mess&Anger — Full Deploy Pipeline      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan

# Step 1: Web Build + Deploy
if (-not $SkipWebDeploy) {
  Write-Host "`n━━━ [1/2] Web Build & Deploy ━━━" -ForegroundColor Cyan
  & "$PSScriptRoot/deploy-web.ps1" -Server $Server -RemotePath $RemotePath
  if ($LASTEXITCODE -ne 0) { throw "Web deploy failed" }
}

# Step 2: Android Build
if (-not $SkipAndroid) {
  Write-Host "`n━━━ [2/2] Android APK/AAB Build ━━━" -ForegroundColor Cyan
  & "$PSScriptRoot/build-android.ps1" -SkipWebBuild
  if ($LASTEXITCODE -ne 0) { throw "Android build failed" }
}

$stopwatch.Stop()
Write-Host "`n╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      All Builds Complete!                ║" -ForegroundColor Cyan
Write-Host "║      Elapsed: $($stopwatch.Elapsed.TotalMinutes.ToString('0.0')) min       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan

if (-not $SkipWebDeploy) {
  Write-Host "  Web:    https://mess.cvr.name" -ForegroundColor Green
}
if (-not $SkipAndroid) {
  Write-Host "  APK:    $RootDir/app-release-signed.apk" -ForegroundColor Green
  Write-Host "  AAB:    $RootDir/app-release-bundle.aab" -ForegroundColor Green
}
