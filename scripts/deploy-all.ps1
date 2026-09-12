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
  [string]$AdminUser = "",
  [string]$AdminPass = "",
  [switch]$Help,
  [switch]$SkipVerify,
  [switch]$SkipDesktop
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
   -SkipVerify    Skip release version/integrity verification
   -SkipDesktop   Skip Windows desktop (Tauri) build in pipeline
    -AdminUser     Admin username (or ADMIN_USER env)
    -AdminPass     Admin password (or ADMIN_PASS env, never logged)
   -Help          Show this help

EXAMPLES:
  .\scripts\deploy-all.ps1                                    # full pipeline
  .\scripts\deploy-all.ps1 -SkipAndroid -SkipTests            # quick web deploy
  .\scripts\deploy-all.ps1 -SkipBuild -SkipAndroid            # re-deploy from existing dist
  $env:ADMIN_PASS='pass123'; .\scripts\deploy-all.ps1 -AdminUser=myadmin
"@
  exit 0
}

if ([string]::IsNullOrWhiteSpace($AdminUser)) { $AdminUser = $env:ADMIN_USER }
if ([string]::IsNullOrWhiteSpace($AdminPass)) { $AdminPass = $env:ADMIN_PASS }
if (-not $SkipAdminCreate -and ([string]::IsNullOrWhiteSpace($AdminUser) -or [string]::IsNullOrWhiteSpace($AdminPass))) {
  throw "Set -AdminUser/-AdminPass or ADMIN_USER/ADMIN_PASS, or use -SkipAdminCreate"
}

# Machine PATH once carried a literal `%PATH%` entry, which poisons cmd.exe %PATH%
# expansion (node/eslint/tsc stop resolving). Strip it + dedupe before any npm call.
$cleanPath = ($env:Path -split ';' | Where-Object { $_ -and $_ -ne '%PATH%' } | Select-Object -Unique) -join ';'
if ($cleanPath -ne $env:Path) {
  $env:Path = $cleanPath
  Write-Host "  ⚠ PATH sanitized (removed literal %PATH% / duplicate entries)" -ForegroundColor Yellow
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
      npm run lint
      if ($LASTEXITCODE -ne 0) { throw "Lint + TypeScript check failed" }
        Write-Host "  Running tests..." -ForegroundColor Yellow
        # Deterministic: invoke the package bin through node directly. npx/npm-run
        # bin resolution is unreliable on this machine (cmd falls through to
        # "'vitest' is not recognized"); this runs the exact same entry point.
        node "$RootDir\node_modules\vitest\vitest.mjs" run
        if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
    }
   Write-Host "  Building main SPA..." -ForegroundColor Yellow
     npm run build
    if ($LASTEXITCODE -ne 0) { throw "Main SPA build failed" }
    # Add cache-busting version parameter to index.html
    $timestamp = [int](Get-Date -UFormat %s)
    $indexPath = "$RootDir/dist/index.html"
    if (Test-Path $indexPath) {
      (Get-Content $indexPath) -replace 'index\.html([^"]*)', 'index.html?v=$timestamp' | Set-Content $indexPath
      Write-Host "  ✓ Added cache-busting to index.html" -ForegroundColor Green
    }
    Write-Host "  ✓ Main SPA built" -ForegroundColor Green
   } finally { Pop-Location }

  Write-Host "`n━━━ [2/5] Build Admin Panel ━━━" -ForegroundColor Cyan
  if (Test-Path $AdminDir) {
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
  } else {
    Write-Host "  ⚠ Admin directory not found, skipping admin build" -ForegroundColor Yellow
  }

  Write-Host "`n━━━ [3/5] Prepare Signaling Server Files ━━━" -ForegroundColor Cyan
  $ServerDist = "$RootDir/dist/server"
  if (Test-Path $ServerDist) { Remove-Item -Recurse -Force $ServerDist }
  New-Item -ItemType Directory -Path $ServerDist -Force | Out-Null
  Get-ChildItem "$RootDir/server" -File -Filter *.ts | ForEach-Object { Copy-Item $_.FullName "$ServerDist/$($_.Name)" }
  Get-ChildItem "$RootDir/server" -Directory | Where-Object { $_.Name -ne '__tests__' } | ForEach-Object { Copy-Item -Recurse $_.FullName "$ServerDist/$($_.Name)" }
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
# Phase 1.5: Android APK + Release Manifest + Version Verify
# (runs BEFORE web deploy so dist/releases ships to the server)
# ────────────────────────────────────────────────────────────
$ApkBuildSuccess = $false
if (-not $SkipAndroid) {
  Write-Host "`n━━━ [1.5] Build Android APK/AAB ━━━" -ForegroundColor Cyan
  & "$PSScriptRoot/build-android.ps1" -SkipWebBuild
  if ($LASTEXITCODE -ne 0) { throw "Android build failed" }
  $ApkBuildSuccess = $true
 }


# Build Windows desktop (Tauri) so the Windows artifact is produced in-pipeline.
if (-not $SkipDesktop -and $IsWindows) {
  Write-Host "`n━━━ [1.5c] Build Desktop (Windows) ━━━" -ForegroundColor Cyan
  $vcvars = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
  if (Test-Path $vcvars) {
    & cmd /c "call `"$vcvars`" x64 && cd /d `"$RootDir`" && npm run build:desktop:windows"
    if ($LASTEXITCODE -ne 0) { throw "Windows desktop build failed" }
    Write-Host "  ✓ Windows desktop build done" -ForegroundColor Green
  } else {
    Write-Host "  ⚠ VS2022 BuildTools not found — skipping desktop build (Windows exe must already exist in src-tauri target)" -ForegroundColor Yellow
  }
}

# Generate release manifest (SHA-256 + GPG) and VERIFY that every shipped
# artifact is the LATEST messenger version and integrity-intact BEFORE upload.
if (-not $SkipVerify) {
  Write-Host "`n━━━ [1.5b] Release manifest + version verification ━━━" -ForegroundColor Cyan
  Push-Location $RootDir
  try {
    node scripts/release.mjs 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) { throw "Release manifest generation failed" }
    node scripts/verify-release.mjs 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) { throw "Release verification FAILED — artifacts are not the latest version or integrity is broken. Aborting deploy." }
    $pkgVersion = (Get-Content package.json | ConvertFrom-Json).version
    Write-Host "  ✓ All shipped artifacts are version $pkgVersion and integrity-verified" -ForegroundColor Green
  } finally { Pop-Location }
} else {
  Write-Host "`n━━━ Version verification skipped (-SkipVerify) ━━━" -ForegroundColor Yellow
}

# ────────────────────────────────────────────────────────────
# Phase 2: Deploy Web
# ────────────────────────────────────────────────────────────
if (-not $SkipWebDeploy) {
  Write-Host "`n━━━ [4/5] Deploy Web to $Server ━━━" -ForegroundColor Cyan

  $DistDir = "$RootDir/dist"
  if (-not (Test-Path $DistDir)) { throw "dist/ not found. Run without -SkipBuild first." }

  # ── Bump the service-worker CACHE_VERSION on every deploy ──
  # Stale-while-new SW serves the cached index.html cache-first; if the
  # CACHE_VERSION doesn't change, the old app bundle keeps being served
  # (and old signaling seeds linger) even after a fresh build+upload.
  # Bump both the dist copy (uploaded) and the public source (source of truth).
  Write-Host "  Bumping service-worker CACHE_VERSION..." -ForegroundColor Yellow
  $swPath = "$DistDir/sw.js"
  $swSrcPath = "$RootDir/public/sw.js"
  if (Test-Path $swPath) {
    $swText = Get-Content $swPath -Raw
    if ($swText -match "const CACHE_VERSION = 'v(\d+)'") {
      $nextVer = [int]$Matches[1] + 1
      $newVer = "const CACHE_VERSION = 'v$nextVer'"
      ($swText -replace "const CACHE_VERSION = 'v\d+'", $newVer) | Set-Content $swPath -NoNewline
      (Get-Content $swSrcPath -Raw) -replace "const CACHE_VERSION = 'v\d+'", $newVer | Set-Content $swSrcPath -NoNewline
      Write-Host "  ✓ CACHE_VERSION bumped to v$nextVer" -ForegroundColor Green
    } else {
      Write-Host "  ⚠ Could not locate CACHE_VERSION in sw.js; leaving unchanged" -ForegroundColor Yellow
    }
  } else {
    Write-Host "  ⚠ dist/sw.js not found; skipping cache bump" -ForegroundColor Yellow
  }

  Write-Host "  Creating remote dirs..." -ForegroundColor Yellow
  ssh $Server "mkdir -p $WebRoot" 2>&1 | Out-Null

  Write-Host "  Uploading web files..." -ForegroundColor Yellow
    Push-Location $DistDir
    try {
      # Remove ALL files including hidden ones from the target directory
      ssh $Server "rm -rf $WebRoot/* 2>/dev/null; rm -rf $WebRoot/.* 2>/dev/null; mkdir -p $WebRoot"
      # Upload using tar with --overwrite to handle any conflicts
      tar cf - . --exclude=./.git --exclude=./.DS_Store --exclude=./.gitignore | ssh $Server "tar xf - -C $WebRoot --overwrite" 2>$null
      if ($LASTEXITCODE -ne 0) { throw "Web file upload failed" }
      Write-Host "  ✓ Web files uploaded to $WebRoot" -ForegroundColor Green
    } finally { Pop-Location }

# Post-deploy: ensure index.html is not cached (idempotent, guarded by marker)
    Write-Host "  Applying nginx cache-busting..." -ForegroundColor Yellow
    ssh $Server '
      conf=/etc/nginx/conf.d/mess.cvr.name.conf
      if ! grep -q "cache-bust-index" "$conf"; then
        cp "$conf" /tmp/mess.conf.new
        sed -i "s|^    location / {\$|    # cache-bust-index\n    location / {\n        add_header Cache-Control \"no-cache\" always;|" /tmp/mess.conf.new
        sudo cp /tmp/mess.conf.new "$conf"
        rm -f /tmp/mess.conf.new
        sudo nginx -t 2>/dev/null && sudo nginx -s reload 2>/dev/null
      fi
    ' 2>&1 | Out-Null
    
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

  # ── (Re)prepare signaling server dist ──
  # Phase 1 may have created this, but the Android/Desktop builds re-run
  # `npm run build`, whose emptyOutDir wipes dist/ — so recreate it here,
  # just before deploy, to guarantee the artifacts are present.
  $ServerDist = "$RootDir/dist/server"
  if (-not $SkipBuild) {
    if (Test-Path $ServerDist) { Remove-Item -Recurse -Force $ServerDist }
    New-Item -ItemType Directory -Path $ServerDist -Force | Out-Null
    Get-ChildItem "$RootDir/server" -File -Filter *.ts | ForEach-Object { Copy-Item $_.FullName "$ServerDist/$($_.Name)" }
    Get-ChildItem "$RootDir/server" -Directory | Where-Object { $_.Name -ne '__tests__' } | ForEach-Object { Copy-Item -Recurse $_.FullName "$ServerDist/$($_.Name)" }
    Copy-Item "$RootDir/package.json" "$ServerDist/package.json"
    Write-Host "  ✓ Signaling files prepared (dist/server)" -ForegroundColor Green
  }
  if (-not (Test-Path $ServerDist)) { throw "dist/server/ not found. Run without -SkipBuild first." }

  Write-Host "  Uploading server files..." -ForegroundColor Yellow
  ssh $Server "mkdir -p $AppRoot/server/routes $AppRoot/server/middleware" 2>&1 | Out-Null
  Get-ChildItem "$ServerDist" -File -Filter *.ts | ForEach-Object {
    scp $_.FullName "${Server}:$AppRoot/server/$($_.Name)" 2>&1 | Out-Null
  }
  Get-ChildItem "$ServerDist" -Directory | ForEach-Object {
    scp -r $_.FullName "${Server}:$AppRoot/server/" 2>&1 | Out-Null
  }
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

    # ── Inject JWT_SECRET BEFORE the PM2 restart ──
    # The relay (signaling-server.ts) refuses to start without JWT_SECRET and the
    # client's /api/auth/token endpoint (signRelayToken) 500s without it. Ensuring
    # .env is populated first means the process never boots (or restarts) into a
    # missing-secret state that would 500 every relay-token request.
    Write-Host "  Ensuring JWT_SECRET is configured..." -ForegroundColor Yellow
    ssh $Server "grep -q 'JWT_SECRET=' '$AppRoot/.env' 2>/dev/null"
    if ($LASTEXITCODE -ne 0) {
     $jwtSecret = (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))").Trim()
     Write-Host "  Generating new JWT_SECRET..." -ForegroundColor Yellow
     ssh $Server "echo 'JWT_SECRET=$jwtSecret' >> '$AppRoot/.env'" 2>&1 | Out-Null
     Write-Host "  ✓ JWT_SECRET added to .env" -ForegroundColor Green
   } else {
     Write-Host "  ✓ JWT_SECRET already configured" -ForegroundColor Green
   }

   Write-Host "  Restarting signaling server via PM2..." -ForegroundColor Yellow
   $pm2Status = ssh $Server "pm2 list 2>&1 | grep $Pm2Name" 2>&1
   if ($pm2Status) {
     ssh $Server "set -a; [ -f '$AppRoot/.env' ] && source '$AppRoot/.env'; set +a; cd '$AppRoot' && pm2 restart $Pm2Name --update-env 2>&1" 2>&1 | Out-Null
     Write-Host "  ✓ PM2 process '$Pm2Name' restarted" -ForegroundColor Green
   } else {
     Write-Host "  Starting new PM2 process '$Pm2Name'..." -ForegroundColor Yellow
     ssh $Server "set -a; [ -f '$AppRoot/.env' ] && source '$AppRoot/.env'; set +a; cd '$AppRoot' && pm2 start server/signaling-server.ts --name $Pm2Name --interpreter npx --interpreter-args tsx 2>&1" 2>&1 | Out-Null
     Write-Host "  ✓ PM2 process '$Pm2Name' started" -ForegroundColor Green
   }
   ssh $Server "pm2 save" 2>&1 | Out-Null


    # ── Create admin user if not skipped ──
     if (-not $SkipAdminCreate) {
       Write-Host "`n━━━ [6/6] Create Admin User ━━━" -ForegroundColor Cyan
       Write-Host "  Creating admin '$AdminUser' on server..." -ForegroundColor Yellow
        $jwtSecret = (ssh $Server "grep -m1 'JWT_SECRET=' '$AppRoot/.env' | cut -d= -f2 -s" 2>&1).Trim()
       if (-not $jwtSecret) {
         Write-Host "  ⚠ JWT_SECRET not found in .env, generating..." -ForegroundColor Yellow
         $jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
         ssh $Server "echo 'JWT_SECRET=$jwtSecret' >> '$AppRoot/.env'" 2>&1 | Out-Null
       }
       $cliResult = ssh $Server "cd '$AppRoot' && JWT_SECRET='$jwtSecret' npx tsx server/cli.ts '$AdminUser' '$AdminPass'" 2>&1
        if ($LASTEXITCODE -eq 0 -or $cliResult -match "created successfully") {
          Write-Host "  ✓ Admin '$AdminUser' created" -ForegroundColor Green
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
# Android build + APK copy + release manifest + verify were moved to
# Phase 1.5 (above) so dist/releases uploads together with the web deploy.
# ────────────────────────────────────────────────────────────

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
  Write-Host "  Play:   https://play.google.com/store/apps/details?id=com.messanger.e2e" -ForegroundColor Green
  Write-Host "  Sidelo: $RootDir/app-release-signed.apk (testing only, not public)" -ForegroundColor Green
}
