param(
  [switch]$SkipTests,
  [switch]$SkipAdmin,
  [switch]$SkipLint
)

$ErrorActionPreference = "Stop"
$RootDir = Resolve-Path "$PSScriptRoot/.."
$AdminDir = "$RootDir/admin"

Write-Host "=== Mess&Anger Web Build ===" -ForegroundColor Cyan
Write-Host "Root: $RootDir" -ForegroundColor Gray

if (-not $SkipLint) {
  Write-Host "`n[1/4] Running ESLint + TypeScript check..." -ForegroundColor Yellow
  Push-Location $RootDir
  try {
    npx eslint src/ --ext .ts,.tsx --quiet 2>&1 | ForEach-Object { Write-Host $_ }
    $eslintOk = $LASTEXITCODE -eq 0
    npx tsc --noEmit 2>&1 | ForEach-Object { Write-Host $_ }
    $tscOk = $LASTEXITCODE -eq 0
    if ($eslintOk -and $tscOk) {
      Write-Host "  ✓ Lint passed" -ForegroundColor Green
    } else {
      Write-Host "  ⚠ Lint/TypeScript has warnings (non-blocking)" -ForegroundColor Yellow
    }
  } finally { Pop-Location }
}

if (-not $SkipTests) {
  Write-Host "`n[2/4] Running tests..." -ForegroundColor Yellow
  Push-Location $RootDir
  try {
    npx vitest run 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
    Write-Host "  ✓ Tests passed" -ForegroundColor Green
  } finally { Pop-Location }
}

Write-Host "`n[3/4] Building main SPA..." -ForegroundColor Yellow
Push-Location $RootDir
try {
  npm run build 2>&1 | ForEach-Object { Write-Host $_ }
  if ($LASTEXITCODE -ne 0) { throw "Build failed" }
  Write-Host "  ✓ Main SPA built: $RootDir/dist" -ForegroundColor Green
} finally { Pop-Location }

if (-not $SkipAdmin) {
  Write-Host "`n[4/4] Building admin panel..." -ForegroundColor Yellow
  Push-Location $AdminDir
  try {
    npm install 2>&1 | Out-Null
    npm run build 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  ⚠ Admin build had issues (non-blocking)" -ForegroundColor Yellow
    } else {
      $AdminDist = "$RootDir/dist/admin"
      if (Test-Path "$AdminDir/dist") {
        if (Test-Path $AdminDist) { Remove-Item -Recurse -Force $AdminDist }
        Copy-Item -Recurse "$AdminDir/dist" $AdminDist
        Write-Host "  ✓ Admin panel built and copied to $AdminDist" -ForegroundColor Green
      } else {
        Write-Host "  ✓ Admin panel built: $AdminDir/dist" -ForegroundColor Green
      }
    }
  } finally { Pop-Location }
}

$DistSize = (Get-ChildItem -Recurse "$RootDir/dist" | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "`n=== Build Complete ===" -ForegroundColor Cyan
Write-Host "  Output: $RootDir/dist ($([math]::Round($DistSize, 2)) MB)" -ForegroundColor Green
Write-Host "  Ready for deployment via: scripts/deploy-secure.sh or your own web server" -ForegroundColor Gray
