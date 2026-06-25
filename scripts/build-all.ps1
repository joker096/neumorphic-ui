param(
  [string]$AppVersion = "1.0.0",
  [int]$VersionCode = 1,
  [string]$KeystorePath = "",
  [string]$PwaUrl = "https://mess.cvr.name",
  [switch]$SkipTests,
  [switch]$SkipAndroid,
  [switch]$Help
)

$ErrorActionPreference = "Stop"
$RootDir = Resolve-Path "$PSScriptRoot/.."

if ($Help) {
  Write-Host @"
Mess&Anger — Build All Script
==============================
Builds the web version and optionally the Android APK/AAB.

USAGE:
  .\scripts\build-all.ps1 [[-AppVersion] <string>] [[-VersionCode] <int>] [options]

OPTIONS:
  -AppVersion     App version name (default: 1.0.0)
  -VersionCode    App version code (default: 1)
  -KeystorePath   Path to .jks keystore for Android signing
  -PwaUrl         Public HTTPS URL of the PWA (default: https://mess.cvr.name)
  -SkipTests      Skip running tests
  -SkipAndroid    Skip Android build (web only)
  -Help           Show this help
"@
  exit 0
}

Write-Host @"

╔══════════════════════════════════════════╗
║        Mess&Anger — Build All           ║
╚══════════════════════════════════════════╝
"@ -ForegroundColor Cyan

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

# ── 1. Web Build ──
Write-Host "`n━━━ [1/2] Web Production Build ━━━" -ForegroundColor Cyan
$webArgs = @()
if ($SkipTests) { $webArgs += "-SkipTests" }
& "$PSScriptRoot/build-web.ps1" @webArgs
if ($LASTEXITCODE -ne 0) { throw "Web build failed" }

# ── 2. Android Build ──
if (-not $SkipAndroid) {
  Write-Host "`n━━━ [2/2] Android APK/AAB Build ━━━" -ForegroundColor Cyan
  $androidArgs = @("-SkipWebBuild", "-AppVersion", $AppVersion, "-VersionCode", $VersionCode, "-PwaUrl", $PwaUrl)
  if ($KeystorePath) { $androidArgs += "-KeystorePath"; $androidArgs += $KeystorePath }
  & "$PSScriptRoot/build-android.ps1" @androidArgs
  if ($LASTEXITCODE -ne 0) { throw "Android build failed" }
} else {
  Write-Host "`n━━━ [2/2] Android Build Skipped ━━━" -ForegroundColor Yellow
}

$stopwatch.Stop()
Write-Host @"

╔══════════════════════════════════════════╗
║      All Builds Complete!                ║
║      Elapsed: $($stopwatch.Elapsed.TotalMinutes.ToString('0.0')) minutes            ║
╚══════════════════════════════════════════╝
"@ -ForegroundColor Cyan

if (Test-Path "$RootDir/dist") {
  $distSize = (Get-ChildItem -Recurse "$RootDir/dist" | Measure-Object -Property Length -Sum).Sum / 1MB
  Write-Host "  Web:    $RootDir/dist ($([math]::Round($distSize, 2)) MB)" -ForegroundColor Green
}
if (-not $SkipAndroid -and (Test-Path "$RootDir/app-release.aab")) {
  $aabSize = (Get-Item "$RootDir/app-release.aab").Length / 1MB
  Write-Host "  Android: $RootDir/app-release.aab ($([math]::Round($aabSize, 2)) MB)" -ForegroundColor Green
  Write-Host "          $RootDir/app-release.apk" -ForegroundColor Green
}
Write-Host "`nReady for deployment and distribution!" -ForegroundColor Cyan
