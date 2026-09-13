#!/usr/bin/env node
/**
 * Windows MSI rescue builder.
 *
 * tauri bundler 2.x renders main.wxs with handlebars `no_escape`, so any `&`
 * in the product name lands as a raw XML byte and candle.exe fails to parse.
 * This script takes the main.wxs tauri already generated (candle aborts with a
 * non-zero exit but the .wxs and the copied resources/icon.ico remain on disk),
 * escapes the bare ampersands, and runs the exact candle/light commands the
 * bundler would have run — producing a valid MSI.
 *
 * Usage:
 *   node scripts/build-windows-msi.mjs            # auto-discover target dir + WiX
 *   node scripts/build-windows-msi.mjs --target-dir <path>  # explicit release dir
 *
 * Environment:
 *   WIX_TOOLS          path to WiX 3 binaries (default: %LOCALAPPDATA%\tauri\WixTools314)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, renameSync } from 'node:fs'
import { join, sep, dirname, basename } from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const tauriConf = JSON.parse(readFileSync(join(appRoot, 'src-tauri', 'tauri.conf.json'), 'utf8'))
const pkg = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))

const productName = tauriConf.productName
const version = pkg.version

const args = process.argv.slice(2)
const targetDirArg =
  args.indexOf('--target-dir') >= 0 ? args[args.indexOf('--target-dir') + 1] : null

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function findReleaseDir() {
  const candidates = []
  const targetsRoot = join(appRoot, 'src-tauri', 'target')
  if (!existsSync(targetsRoot)) return null
  for (const triple of readdirSync(targetsRoot)) {
    const release = join(targetsRoot, triple, 'release')
    if (existsSync(join(release, 'wix'))) candidates.push({ triple, release })
  }
  if (candidates.length === 0) return null
  return candidates.sort((a, b) => (a.triple === 'release' ? 1 : 0))[0]
}

function wixToolsPath() {
  if (process.env.WIX_TOOLS) return process.env.WIX_TOOLS
  const local = process.env.LOCALAPPDATA
  if (local && existsSync(join(local, 'tauri', 'WixTools314'))) return join(local, 'tauri', 'WixTools314')
  const home = process.env.USERPROFILE || process.env.HOME
  if (home && existsSync(join(home, '.cache', 'tauri', 'WixTools314'))) return join(home, '.cache', 'tauri', 'WixTools314')
  return null
}

function wixEnv() {
  const keep = new Set(['SYSTEMROOT', 'SystemRoot', 'TMP', 'TEMP', 'PATH'])
  const env = {}
  for (const [k, v] of Object.entries(process.env)) {
    const upper = k.toUpperCase()
    if (upper === 'SYSTEMROOT') {
      env.SYSTEMROOT = v
      env.SystemRoot = v
    } else if (upper === 'TMP' && v) env.TMP = v
    else if (upper === 'TEMP' && v) env.TEMP = v
    else if (upper.startsWith('TAURI')) env[k] = v
    else if (upper === 'PATH' && v) env.PATH = v
  }
  return env
}

function run(cmd, cwd, toolSet, argsList, label) {
  console.log(`\n=== ${label} ===`)
  console.log(`cwd : ${cwd}`)
  console.log(`cmd : ${toolSet}${sep}${cmd} ${argsList.join(' ')}`)
  const env = wixEnv()
  const res = spawnSync(join(toolSet, cmd), argsList, { cwd, env, encoding: 'utf8' })
  if (res.stdout) console.log(res.stdout.trim())
  if (res.stderr) console.error(res.stderr.trim())
  if (res.status !== 0) {
    console.error(`FAILED ${label} (exit ${res.status})`)
    process.exit(res.status ?? 1)
  }
}

function main() {
  const tools = wixToolsPath()
  if (!tools) {
    console.error('WiX 3 toolset not found. Set WIX_TOOLS or run `tauri build --bundles msi` once to let tauri download it.')
    process.exit(1)
  }

  const rel = targetDirArg ? { triple: targetDirArg, release: targetDirArg } : findReleaseDir()
  if (!rel) {
    console.error('No src-tauri/target/<triple>/release/wix dir found. Run `tauri build --bundles msi` first.')
    process.exit(1)
  }

  const archDirs = existsSync(join(rel.release, 'wix'))
    ? readdirSync(join(rel.release, 'wix')).filter((d) => d === 'x64' || d === 'x86' || d === 'arm64')
    : []
  if (archDirs.length === 0) {
    console.error(`No arch dir in ${join(rel.release, 'wix')}.`)
    process.exit(1)
  }
  const arch = archDirs[0]
  const wixDir = join(rel.release, 'wix', arch)
  const mainWxs = join(wixDir, 'main.wxs')
  if (!existsSync(mainWxs)) {
    console.error(`main.wxs not found: ${mainWxs}`)
    process.exit(1)
  }

  const exeCandidates = readdirSync(rel.release)
    .filter((f) => f.toLowerCase().endsWith('.exe'))
    .map((f) => join(rel.release, f))
    .filter((p) => !/uninstall/i.test(p))
  const exe = exeCandidates.sort((a, b) => {
    const prio = (p) => {
      const n = basename(p).toLowerCase()
      if (n.includes('mess') || n.includes('anger') || n.includes('messandanger')) return 0
      return 1
    }
    return prio(a) - prio(b)
  })[0]
  if (!exe || !existsSync(exe)) {
    console.error(`App executable not found under ${rel.release}.`)
    process.exit(1)
  }

  console.log(`\nproduct: ${productName}`)
  console.log(`version: ${version}`)
  console.log(`arch   : ${arch}`)
  console.log(`exe    : ${exe}`)
  console.log(`wix    : ${tools}`)
  console.log(`wixDir : ${wixDir}`)

  const wxs = readFileSync(mainWxs, 'utf8')
  const patched = wxs.replace(/&(?!amp;|apos;|lt;|gt;|quot;|#)/g, '&amp;')
  writeFileSync(mainWxs, patched)

  const lang = 'en-US'
  const langId = '1033'
  const codepage = '1252'
  const pn = xmlEscape(productName)
  const localeWxl = join(wixDir, 'locale.wxl')
  writeFileSync(
    localeWxl,
    `<WixLocalization Culture="en-us" xmlns="http://schemas.microsoft.com/wix/2006/localization">\n` +
      `  <String Id="TauriLanguage">${langId}</String>\n` +
      `  <String Id="TauriCodepage">${codepage}</String>\n` +
      `  <String Id="LaunchApp">Launch ${pn}</String>\n` +
      `  <String Id="DowngradeErrorMessage">A newer version of ${pn} is already installed.</String>\n` +
      `  <String Id="PathEnvVarFeature">Add the install location of the ${pn} executable to the PATH system environment variable. This allows the ${pn} executable to be called from any location.</String>\n` +
      `  <String Id="InstallAppFeature">Installs ${pn}.</String>\n` +
      `</WixLocalization>\n`,
    'utf8',
  )

  run('candle.exe', wixDir, tools, ['-arch', arch, 'main.wxs', `-dSourceDir=${exe}`], 'CANDLE')

  const wixobjs = readdirSync(wixDir).filter((f) => f.endsWith('.wixobj'))
  const lightArgs = [
    '-o', 'output.msi',
    '-cultures:en-us',
    '-loc', 'locale.wxl',
    ...wixobjs,
    '-ext', join(tools, 'WixUIExtension.dll'),
    '-ext', join(tools, 'WixUtilExtension.dll'),
  ]
  run('light.exe', wixDir, tools, lightArgs, 'LIGHT')

  const msiDir = join(rel.release, 'bundle', 'msi')
  mkdirSync(msiDir, { recursive: true })
  const out = join(msiDir, `${productName}_${version}_${arch}_${lang}.msi`)
  renameSync(join(wixDir, 'output.msi'), out)
  const bytes = existsSync(out)
  console.log(`\nMSI built: ${out} (${bytes ? `${(readFileSync(out).length / 1048576).toFixed(2)} MB` : '?'})`)
}

main()