param(
  [switch]$SkipWebBuild,
  [switch]$SkipBuild,
  [switch]$Help
)

if ($Help) {
  Write-Host @"
Mess&Anger Android Build Script
================================
Wraps the PWA into Android APK/AAB via Trusted Web Activity.

USAGE:
  .\scripts\build-android.ps1 [options]

OPTIONS:
  -SkipWebBuild  Skip web build (use existing dist/)
  -SkipBuild     Skip Gradle build (only generate project)
  -Help          Show this help

REQUIREMENTS (auto-detected):
  - Node.js 18+
  - JDK 17+  (JAVA_HOME)
  - Android SDK (ANDROID_HOME)
  - @bubblewrap/core (npm, installed as devDep)

OUTPUT:
  ./app-release-signed.apk   — for sideloading
  ./app-release-bundle.aab   — for Google Play
"@
  exit 0
}

$RootDir = Resolve-Path "$PSScriptRoot/.."
Write-Host "=== Mess&Anger Android Build ===" -ForegroundColor Cyan

# Load .env file into environment variables
$EnvFile = Join-Path $RootDir ".env"
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.+)\s*$') {
      $key = $matches[1].Trim()
      $val = $matches[2].Trim()
      Set-Item -Path "Env:$key" -Value $val
    }
  }
}

# Check prerequisites
$ok = $true
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  Write-Host "  ✗ JDK not found (java not in PATH)" -ForegroundColor Red; $ok = $false
} else {
  Write-Host "  ✓ JDK: $(java -version 2>&1 | Select-Object -First 1)" -ForegroundColor Green
}
if (-not $env:ANDROID_HOME) {
  Write-Host "  ⚠ ANDROID_HOME not set" -ForegroundColor Yellow
} else {
  Write-Host "  ✓ ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
}
if (-not $env:JAVA_HOME) {
  Write-Host "  ⚠ JAVA_HOME not set" -ForegroundColor Yellow
} else {
  Write-Host "  ✓ JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
}
if (-not $ok) { exit 1 }

# Delegate to Node.js script
$argsList = @()
if ($SkipWebBuild) { $argsList += "--skip-web-build" }
if ($SkipBuild) { $argsList += "--skip-build" }

Write-Host "`nRunning Android build..." -ForegroundColor Yellow
node "$PSScriptRoot/build-android.mjs" $argsList
exit $LASTEXITCODE
