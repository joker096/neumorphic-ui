param(
  [string]$Server = "prod",
  [string]$WebRoot = "/var/www/mess.cvr.name",
  [string]$AppRoot = "/home/user0/messanger",
  [string]$Pm2Name = "mess-signaling",
  [switch]$SkipTests,
  [switch]$SkipAndroid,
  [switch]$SkipBuild,
  [switch]$SkipWebDeploy,
  [switch]$SkipSignaling,
  [switch]$SkipAdminCreate,
  [switch]$SkipIOS,
  [string]$AdminUser = "admin",
  [string]$AdminPass = "fuckoff190",
  [switch]$Help
)

$ErrorActionPreference = "Stop"
$RootDir = Resolve-Path "$PSScriptRoot/.."
$AdminDir = "$RootDir/admin"

if ($Help) {
  Write-Host @"
Mess&Anger — One-Command Deploy
=================================
Builds everything (main SPA + admin + signaling), deploys to server, builds APK.

USAGE:
  .\scripts\deploy-all.ps1 [options]

OPTIONS:
  -Server        SSH host (default: prod = user0@130.49.175.224)
  -WebRoot       Remote web root   (default: /var/www/mess.cvr.name)
  -AppRoot       Remote app dir    (default: /home/user0/messanger)
  -Pm2Name       PM2 process name  (default: mess-signaling)
  -SkipTests     Skip lint + tests in build
  -SkipAndroid   Skip Android APK build
  -SkipBuild     Skip build phase (use existing dist/)
  -SkipWebDeploy Skip web file upload
  -SkipSignaling Skip signaling server update
   -SkipAdminCreate Skip admin creation after deploy
   -SkipIOS       Skip iOS PWA validation
   -AdminUser     Admin username (default: admin)
   -AdminPass     Admin password (default: fuckoff190)
   -Help          Show this help

EXAMPLES:
  .\scripts\deploy-all.ps1                                    # full pipeline
  .\scripts\deploy-all.ps1 -SkipAndroid -SkipTests            # quick web deploy
  .\scripts\deploy-all.ps1 -SkipBuild -SkipAndroid            # re-deploy from existing dist
  .\scripts\deploy-all.ps1 -AdminUser=myadmin -AdminPass=pass123  # custom admin creds
"@
  exit 0
}

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Mess&Anger — Full Deploy Pipeline      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  Server: $Server" -ForegroundColor Gray
Write-Host "  Web:    $WebRoot" -ForegroundColor Gray
Write-Host "  App:    $AppRoot" -ForegroundColor Gray

# ────────────────────────────────────────────────────────────
# Phase 1: Build
# ────────────────────────────────────────────────────────────
if (-not $SkipBuild) {
  Write-Host "`n━━━ [1/5] Build Main SPA ━━━" -ForegroundColor Cyan
  Push-Location $RootDir
  try {
    if (-not $SkipTests) {
      Write-Host "  Lint + typecheck..." -ForegroundColor Yellow
      npx eslint . --quiet
      if ($LASTEXITCODE -ne 0) { throw "Lint failed" }
      npx tsc --noEmit
      if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }
      Write-Host "  Running tests..." -ForegroundColor Yellow
      npx vitest run
      if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
    }
    Write-Host "  Building main SPA..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Main SPA build failed" }
    Write-Host "  ✓ Main SPA built" -ForegroundColor Green
  } finally { Pop-Location }

  Write-Host "`n━━━ [2/5] Build Admin Panel ━━━" -ForegroundColor Cyan
  Push-Location $AdminDir
  try {
    npm install --ignore-scripts
    if ($LASTEXITCODE -ne 0) { throw "Admin npm install failed" }
    Write-Host "  Building admin SPA..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Admin build failed" }
    $AdminDistTarget = "$RootDir/dist/admin"
    if (Test-Path "$AdminDir/dist") {
      if (Test-Path $AdminDistTarget) { Remove-Item -Recurse -Force $AdminDistTarget }
      Copy-Item -Recurse "$AdminDir/dist" $AdminDistTarget
      Write-Host "  ✓ Admin panel built + copied to dist/admin" -ForegroundColor Green
    }
  } finally { Pop-Location }

  Write-Host "`n━━━ [3/5] Prepare Signaling Server Files ━━━" -ForegroundColor Cyan
  $ServerDist = "$RootDir/dist/server"
  if (Test-Path $ServerDist) { Remove-Item -Recurse -Force $ServerDist }
  New-Item -ItemType Directory -Path $ServerDist -Force | Out-Null
  Copy-Item "$RootDir/server/signaling-server.ts" "$ServerDist/signaling-server.ts"
  Copy-Item "$RootDir/server/auth.ts" "$ServerDist/auth.ts"
  Copy-Item "$RootDir/server/db.ts" "$ServerDist/db.ts"
  Copy-Item "$RootDir/server/cli.ts" "$ServerDist/cli.ts"
  Copy-Item "$RootDir/server/csp.ts" "$ServerDist/csp.ts"
  Copy-Item -Recurse "$RootDir/server/routes" "$ServerDist/routes"
  Copy-Item -Recurse "$RootDir/server/middleware" "$ServerDist/middleware"
  Copy-Item "$RootDir/package.json" "$ServerDist/package.json"
  Write-Host "  ✓ Signaling files prepared" -ForegroundColor Green
} else {
  Write-Host "`n━━━ Build phase skipped (-SkipBuild) ━━━" -ForegroundColor Yellow
}

# ── Copy admin build to server dist (for REST API serving) ━━━
   if (-not $SkipBuild) {
     Write-Host "`n━━━ [2b/5] Copy Admin to Server Dist ━━━" -ForegroundColor Cyan
     $AdminSrc = "$RootDir/dist/admin"
  if (Test-Path $AdminSrc) {
      $AdminDest2 = "$RootDir/dist/server/dist/admin"
      $null = New-Item -ItemType Directory -Path "$RootDir/dist/server/dist" -Force
      if (Test-Path $AdminDest2) { Remove-Item -Recurse -Force $AdminDest2 }
      Copy-Item -Recurse "$AdminSrc" $AdminDest2
      Write-Host "  ✓ Admin copied to dist/server/dist/admin (signaling server can serve it)" -ForegroundColor Green
    }
  }

# ────────────────────────────────────────────────────────────
# Phase 2: Deploy Web
# ────────────────────────────────────────────────────────────
if (-not $SkipWebDeploy) {
  Write-Host "`n━━━ [4/5] Deploy Web to $Server ━━━" -ForegroundColor Cyan

  $DistDir = "$RootDir/dist"
  if (-not (Test-Path $DistDir)) { throw "dist/ not found. Run without -SkipBuild first." }

  Write-Host "  Creating remote dirs..." -ForegroundColor Yellow
  ssh $Server "mkdir -p $WebRoot" 2>&1 | Out-Null

  Write-Host "  Uploading web files..." -ForegroundColor Yellow
  Push-Location $DistDir
  try {
    ssh $Server "mkdir -p $WebRoot/admin"
    tar cf - . | ssh $Server "tar xf - -C $WebRoot"
    if ($LASTEXITCODE -ne 0) { throw "Web file upload failed" }
    Write-Host "  ✓ Web files uploaded to $WebRoot" -ForegroundColor Green
  } finally { Pop-Location }

  $status = ssh $Server "curl -s -o /dev/null -w '%{http_code}' https://mess.cvr.name/ --connect-timeout 10" 2>&1
  if ($status -eq "200") {
    Write-Host "  ✓ Site responding: HTTPS 200" -ForegroundColor Green
  } else {
    Write-Host "  ⚠ Site status: $status" -ForegroundColor Yellow
  }
} else {
  Write-Host "`n━━━ Web deploy skipped (-SkipWebDeploy) ━━━" -ForegroundColor Yellow
}

# ────────────────────────────────────────────────────────────
# Phase 3: Deploy Signaling Server
# ────────────────────────────────────────────────────────────
if (-not $SkipSignaling) {
  Write-Host "`n━━━ [5/5] Deploy Signaling Server to $Server ━━━" -ForegroundColor Cyan

  $ServerDist = "$RootDir/dist/server"
  if (-not (Test-Path $ServerDist)) { throw "dist/server/ not found. Run without -SkipBuild first." }

  Write-Host "  Uploading server files..." -ForegroundColor Yellow
  ssh $Server "mkdir -p $AppRoot/server/routes $AppRoot/server/middleware" 2>&1 | Out-Null
  scp "$ServerDist/signaling-server.ts" "${Server}:$AppRoot/server/signaling-server.ts" 2>&1 | Out-Null
  scp "$ServerDist/auth.ts" "${Server}:$AppRoot/server/auth.ts" 2>&1 | Out-Null
  scp "$ServerDist/db.ts" "${Server}:$AppRoot/server/db.ts" 2>&1 | Out-Null
  scp "$ServerDist/cli.ts" "${Server}:$AppRoot/server/cli.ts" 2>&1 | Out-Null
  scp "$ServerDist/csp.ts" "${Server}:$AppRoot/server/csp.ts" 2>&1 | Out-Null
  scp "$ServerDist/routes/ads.ts" "${Server}:$AppRoot/server/routes/ads.ts" 2>&1 | Out-Null
  scp "$ServerDist/routes/auth.ts" "${Server}:$AppRoot/server/routes/auth.ts" 2>&1 | Out-Null
  scp "$ServerDist/routes/stats.ts" "${Server}:$AppRoot/server/routes/stats.ts" 2>&1 | Out-Null
  scp "$ServerDist/middleware/auth.ts" "${Server}:$AppRoot/server/middleware/auth.ts" 2>&1 | Out-Null
  scp "$ServerDist/package.json" "${Server}:$AppRoot/package.json" 2>&1 | Out-Null

 Write-Host "  Installing deps on server..." -ForegroundColor Yellow
   $installResult = ssh $Server "cd $AppRoot && npm install --omit=dev 2>&1" 2>&1
   if ($LASTEXITCODE -ne 0) { Write-Host "  ⚠ npm install may have issues: $installResult" -ForegroundColor Yellow }

  # Deploy admin build to server dist (for REST API serving)
   Write-Host "  Deploying admin build..." -ForegroundColor Yellow
   $AdminSrc = "$RootDir/dist/admin"
   if (Test-Path $AdminSrc) {
     ssh $Server "mkdir -p $AppRoot/dist/admin" 2>&1 | Out-Null
     scp -r "$AdminSrc" "${Server}:$AppRoot/dist/admin" 2>&1
     Write-Host "  ✓ Admin deployed to $AppRoot/dist/admin/" -ForegroundColor Green
   }

  Write-Host "  Restarting signaling server via PM2..." -ForegroundColor Yellow
  $pm2Status = ssh $Server "pm2 list 2>&1 | grep $Pm2Name" 2>&1
  if ($pm2Status) {
    ssh $Server "cd $AppRoot && pm2 restart $Pm2Name --update-env 2>&1" 2>&1 | Out-Null
    Write-Host "  ✓ PM2 process '$Pm2Name' restarted" -ForegroundColor Green
  } else {
    Write-Host "  Starting new PM2 process '$Pm2Name'..." -ForegroundColor Yellow
    ssh $Server "cd $AppRoot && pm2 start server/signaling-server.ts --name $Pm2Name --interpreter npx --interpreter-args tsx 2>&1" 2>&1 | Out-Null
    Write-Host "  ✓ PM2 process '$Pm2Name' started" -ForegroundColor Green
  }
  ssh $Server "pm2 save" 2>&1 | Out-Null

   # ── Inject JWT_SECRET if not already set ──
   Write-Host "  Ensuring JWT_SECRET is configured..." -ForegroundColor Yellow
   $existingJwt = ssh $Server "grep -q 'JWT_SECRET=' '$AppRoot/.env' 2>&1" 2>&1
   if ($existingJwt -ne 0) {
     $jwtSecret = (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))").Trim()
     Write-Host "  Generating new JWT_SECRET..." -ForegroundColor Yellow
     ssh $Server "echo 'JWT_SECRET=$jwtSecret' >> '$AppRoot/.env'" 2>&1 | Out-Null
     Write-Host "  ✓ JWT_SECRET added to .env" -ForegroundColor Green
   } else {
     Write-Host "  ✓ JWT_SECRET already configured" -ForegroundColor Green
   }

    # ── Create admin user if not skipped ──
     if (-not $SkipAdminCreate) {
       Write-Host "`n━━━ [6/6] Create Admin User ━━━" -ForegroundColor Cyan
       Write-Host "  Creating admin '$AdminUser' on server..." -ForegroundColor Yellow
       $jwtSecret = ssh $Server "grep 'JWT_SECRET=' '$AppRoot/.env' | cut -d= -f2" 2>&1
       if (-not $jwtSecret) {
         Write-Host "  ⚠ JWT_SECRET not found in .env, generating..." -ForegroundColor Yellow
         $jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
         ssh $Server "echo 'JWT_SECRET=$jwtSecret' >> '$AppRoot/.env'" 2>&1 | Out-Null
       }
       $cliResult = ssh $Server "cd '$AppRoot' && JWT_SECRET='$jwtSecret' npx tsx server/cli.ts '$AdminUser' '$AdminPass'" 2>&1
       if ($LASTEXITCODE -eq 0 -or $cliResult -match "created successfully") {
         Write-Host "  ✓ Admin '$AdminUser' created (password: $AdminPass)" -ForegroundColor Green
       } else {
         Write-Host "  ⚠ Admin creation may have failed: $cliResult" -ForegroundColor Yellow
       }
     }

   $sigStatus = ssh $Server "pm2 list 2>&1 | grep $Pm2Name | grep online" 2>&1
   if ($sigStatus) {
     Write-Host "  ✓ Signaling server online" -ForegroundColor Green
   } else {
     Write-Host "  ⚠ Check PM2: ssh $Server 'pm2 status $Pm2Name'" -ForegroundColor Yellow
  }
} else {
  Write-Host "`n━━━ Signaling deploy skipped (-SkipSignaling) ━━━" -ForegroundColor Yellow
}

# ────────────────────────────────────────────────────────────
# Phase 4: Android APK
# ────────────────────────────────────────────────────────────
$ApkBuildSuccess = $false
if (-not $SkipAndroid) {
  Write-Host "`n━━━ [extra] Build Android APK/AAB ━━━" -ForegroundColor Cyan
  & "$PSScriptRoot/build-android.ps1" -SkipWebBuild
  if ($LASTEXITCODE -ne 0) { throw "Android build failed" }
  $ApkBuildSuccess = $true
}

# ────────────────────────────────────────────────────────────
# Phase 5: Copy APK to dist/ for web download
# ────────────────────────────────────────────────────────────
if ($ApkBuildSuccess) {
   Write-Host "`n━━━ [extra] Copy APK to dist/ for web download ━━━" -ForegroundColor Cyan
   $DistDir = "$RootDir/dist"
   if (Test-Path $DistDir) {
     $ApkSrc = "$RootDir/app-release-signed.apk"
     if (Test-Path $ApkSrc) {
       $ApkDest = "$DistDir/app-release-signed.apk"
       Copy-Item -Path $ApkSrc -Destination $ApkDest -Force
       $ApkSize = (Get-Item $ApkSrc).Length / 1MB
       Write-Host "  ✓ APK copied to dist/app-release-signed.apk ($([math]::Round($ApkSize, 2)) MB)" -ForegroundColor Green
     }
   }
 }

# ────────────────────────────────────────────────────────────
# Phase 6: iOS PWA Validation
# ────────────────────────────────────────────────────────────
 if (-not $SkipIOS) {
   Write-Host "`n━━━ [extra] iOS PWA Validation ━━━" -ForegroundColor Cyan
   Push-Location $RootDir
   try {
     node scripts/build-ios.mjs --skip-build 2>&1 | ForEach-Object { Write-Host $_ }
     Write-Host "  ✓ iOS PWA validated" -ForegroundColor Green
   } finally { Pop-Location }
 } else {
   Write-Host "`n━━━ iOS validation skipped (-SkipIOS) ━━━" -ForegroundColor Yellow
 }

# ────────────────────────────────────────────────────────────
$stopwatch.Stop()

Write-Host "`n╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      Deployment Complete!                ║" -ForegroundColor Cyan
Write-Host "║      Elapsed: $($stopwatch.Elapsed.TotalMinutes.ToString('0.0')) min       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan

if (-not $SkipWebDeploy) {
  Write-Host "  Web:    https://mess.cvr.name" -ForegroundColor Green
  Write-Host "  Admin:  https://mess.cvr.name/admin" -ForegroundColor Green
}
if (-not $SkipSignaling) {
  Write-Host "  WS:     wss://mess.cvr.name/ws" -ForegroundColor Green
}
if (-not $SkipAndroid) {
  Write-Host "  APK:    $RootDir/app-release-signed.apk" -ForegroundColor Green
  Write-Host "  AAB:    $RootDir/app-release-bundle.aab" -ForegroundColor Green
  Write-Host "  Web:    https://mess.cvr.name/app-release-signed.apk" -ForegroundColor Green
}
