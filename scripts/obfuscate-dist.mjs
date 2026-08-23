import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const JavaScriptObfuscator = require('javascript-obfuscator');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'dist', 'assets');

// Vendor chunks are third-party libs — never obfuscate them (keeps them stable + verifiable).
const VENDOR_PREFIXES = ['vendor-', 'state-', 'crypto-', 'animation-', 'icons-', 'ui-'];

const OPTIONS = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  renameGlobals: false,
  renameProperties: false,
  transformObjectKeys: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.35,
  stringArrayWrappersCount: 1,
  stringArrayWrappersChainedCalls: true,
  splitStrings: false,
};

function isVendor(name) {
  return VENDOR_PREFIXES.some((p) => name.startsWith(p));
}

function main() {
  if (!fs.existsSync(ASSETS)) {
    console.error('✖ dist/assets not found — run `npm run build` first.');
    process.exit(1);
  }
  const files = fs.readdirSync(ASSETS).filter((f) => f.endsWith('.js'));
  let done = 0;
  let skipped = 0;
  for (const f of files) {
    const abs = path.join(ASSETS, f);
    if (isVendor(f)) {
      skipped++;
      continue;
    }
    const code = fs.readFileSync(abs, 'utf8');
    const obf = JavaScriptObfuscator.obfuscate(code, { ...OPTIONS, inputFileName: f }).getObfuscatedCode();
    fs.writeFileSync(abs, obf);
    done++;
  }
  console.log(`  ✓ Obfuscated ${done} app chunk(s), skipped ${skipped} vendor chunk(s).`);
}

main();
