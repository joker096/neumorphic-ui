# migrate/migrate.ps1 — оркестратор миграции old -> new (запускать из Windows, из папки migrate/)
#
#   # dry-run (проверить бандл, сервисы не трогаем):
#   pwsh migrate/migrate.ps1 -DryRun
#
#   # production:
#   pwsh migrate/migrate.ps1 -NewHost root@NEW_VPS_IP
#
# Штатный ssh-алиас старого хоста: prod. Новый хост: любой ssh-таргет с root.
param(
  [string]$OldHost = 'prod',
  [string]$NewHost,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
if (-not $DryRun -and -not $NewHost) { throw "нужен -NewHost (ssh alias или user@ip нового VPS)" }

# 1) upload скриптов на old
Write-Host "==> 1. upload export/writers на $OldHost"
scp "$here\export.sh" "$here\writers.sh" "${OldHost}:/tmp/"

# 2) export на old (dry-run не останавливает писателей)
$flags = if ($DryRun) { '--no-stop' } else { '' }
Write-Host "==> 2. export на $OldHost $flags"
$out = ssh $OldHost "bash /tmp/export.sh $flags"
Write-Output $out
$bundleLine = $out | Select-String 'BUNDLE=' | Select-Object -Last 1
if (-not $bundleLine) { throw 'export не вернул BUNDLE=' }
$remoteBundle = ($bundleLine.ToString() -split 'BUNDLE=')[1].Trim()
Write-Host "    bundle: $remoteBundle"

if ($DryRun) {
  Write-Host "==> DRY RUN: bundle создан на old-хосте. Удалить: ssh $OldHost 'rm $remoteBundle'"
  return
}

# 3) old -> local -> new (relay через локальную машину)
$localBundle = Join-Path $env:TEMP (Split-Path $remoteBundle -Leaf)
Write-Host "==> 3a. scp old -> local"
scp "$OldHost:$remoteBundle" $localBundle
Write-Host "==> 3b. scp local -> new"
scp $localBundle "${NewHost}:/root/migrate-bundle.tar.gz"
Write-Host "==> 3c. upload import.sh"
scp "$here\import.sh" "${NewHost}:/root/import.sh"

# 4) import на new
Write-Host "==> 4. import на $NewHost (это займёт время: apt + 4G распаковка)"
ssh $NewHost "bash /root/import.sh /root/migrate-bundle.tar.gz"

# 5) cleanup
Write-Host "==> 5. cleanup"
ssh $NewHost  "rm -f /root/migrate-bundle.tar.gz"
ssh $OldHost  "rm -f $remoteBundle"
Remove-Item $localBundle -ErrorAction SilentlyContinue

Write-Host @"
==> ГОТОВО. Дальше вручную (CUTOVER.md):
  1. DNS: A-записи -> IP нового VPS (TTL 300):
     cvr.name, www.cvr.name, mess.cvr.name, www.mess.cvr.name,
     admin.mess.cvr.name, fennec.cvr.name, photolessons.org,
     www.photolessons.org, seoqube.cvr.name, sud.cvr.name, www.sud.cvr.name
  2. Дождаться TTL, проверить публично:
     curl -I https://mess.cvr.name/health
     curl -sk --http1.1 -H 'Upgrade: websocket' -H 'Connection: Upgrade' https://mess.cvr.name/ws -o /dev/null -w '%{http_code}'
  3. Ре-выдать сертификаты на новом хосте (скопированные живут до expiry):
     certbot --nginx -d mess.cvr.name -d www.mess.cvr.name  (и т.д. для каждого домена)
  4. Old-хост молчит (писатели остановлены). Роллбек = вернуть DNS (сервер не тронут).
  5. Через 48h: decommission old.
"@
