import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

/**
 * Static guard: the standalone embed build (dist/embed.js) must stay isolated
 * from the main app. It must never statically import app store slices or the
 * P2P transport, otherwise a third-party site would pull the whole messenger
 * bundle through the embed snippet.
 *
 * The check walks the transitive import graph rooted at src/embed-entry.tsx
 * and fails if any resolved module lives under src/store/ or src/lib/p2p/.
 */
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EMBED_ENTRY = resolve(SRC, 'embed-entry.tsx');

interface ImportLine {
  specifier: string;
}

function collectImports(file: string): ImportLine[] {
  const src = readFileSync(file, 'utf8');
  const lines: ImportLine[] = [];
  // Handles single-line and multi-line static imports (`from '…'`) plus dynamic `import('…')`.
  const re = /(?:from\s+|import\(\s*)['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    lines.push({ specifier: m[1] });
  }
  return lines;
}

function resolveSpecifier(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith('.')) {
    const base = resolve(dirname(fromFile), specifier);
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
      if (existsSync(candidate) && extname(candidate) !== '.css') return candidate;
    }
  }
  return null; // package / bare import → external, not part of the graph to scan
}

function reachableFiles(entry: string): string[] {
  const seen = new Set<string>();
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const imp of collectImports(file)) {
      const resolved = resolveSpecifier(file, imp.specifier);
      if (resolved) stack.push(resolved);
    }
  }
  return [...seen];
}

describe('embed entry import guard', () => {
  it('never statically imports app store slices or P2P transport', () => {
    const files = reachableFiles(EMBED_ENTRY);
    const offenders = files.filter(
      (f) => /[\\/]store[\\/]/.test(f) || /[\\/]lib[\\/]p2p[\\/]/.test(f),
    );
    expect(offenders).toEqual([]);
  });

  it('reaches the embed widget and its crypto/relay modules', () => {
    const files = reachableFiles(EMBED_ENTRY);
    const names = files.join('\\');
    expect(names).toContain('EmbedWidget');
    expect(names).toContain('embedCrypto');
    expect(names).toContain('relayClient');
  });
});
