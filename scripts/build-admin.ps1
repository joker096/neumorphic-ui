#!/usr/bin/env pwsh
param(
    [switch]$SkipBuild,
    [string]$OutDir = "",
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Mess&Anger — Admin Panel Builder
Builds the admin panel and copies to dist/ for deployment.

USAGE:
  .\scripts\build-admin.ps1 [options]

OPTIONS:
  -SkipBuild    Skip build step, just copy existing dist
  -OutDir       Output directory (default: <project>/dist/admin)
  -Help         Show this help
"@
    exit 0
}

$ErrorActionPreference = "Stop"
$RootDir = Split-Path $PSScriptRoot -Parent
if (-not $OutDir) { $OutDir = "$RootDir/dist/admin" }

Write-Host "`n=== Admin Panel Build ===" -ForegroundColor Cyan
Write-Host "Root: $RootDir" -ForegroundColor Gray
Write-Host "Out:  $OutDir" -ForegroundColor Gray

if (-not $SkipBuild) {
    Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
    Push-Location "$RootDir\admin"
    try {
        npm install --ignore-scripts
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
        Write-Host "`nBuilding admin panel..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
        Write-Host "  ✓ Admin built: $RootDir\admin\dist" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

if (Test-Path "$RootDir\admin\dist") {
    $null = New-Item -ItemType Directory -Path $OutDir -Force
    if (Test-Path $OutDir) { Remove-Item -Recurse -Force "$OutDir\*" -ErrorAction SilentlyContinue }
    Copy-Item -Recurse "$RootDir\admin\dist\*" $OutDir
    Write-Host "  ✓ Admin copied to $OutDir" -ForegroundColor Green
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
