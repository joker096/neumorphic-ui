#!/usr/bin/env pwsh
param(
    [switch]$Deploy,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path $PSScriptRoot -Parent

Write-Host "`n=== Admin Panel Build ===" -ForegroundColor Cyan
Write-Host "Root: $RootDir" -ForegroundColor Gray

if (-not $SkipBuild) {
    Write-Host "`nBuilding admin panel..." -ForegroundColor Yellow
    Push-Location "$RootDir\admin"
    try {
        npm ci --ignore-scripts 2>&1 | Out-Null
        npm run build 2>&1 | Out-Null
        Write-Host "  ✓ Admin built: $RootDir\admin\dist" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

if ($Deploy) {
    Write-Host "Deploying to GitHub Pages..." -ForegroundColor Yellow
    Push-Location "$RootDir\admin"
    try {
        npx gh-pages -d dist -m "[skip ci] Deploy admin panel" 2>&1 | Out-Null
        Write-Host "  ✓ Admin deployed to GitHub Pages" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
