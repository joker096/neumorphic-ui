import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * §4.2 guard: every client→network call must run under a deadline.
 *
 * An inline `fetch()` has no timeout at all, and even an inline AbortController
 * that is cleared right after the headers arrive covers only the headers — a
 * stalled body would keep the await pending forever. The shared helper
 * (`src/lib/network/fetchWithTimeout.ts`) keeps one timer alive across connect,
 * headers and body read, so it is the only place allowed to call `fetch`.
 */
const SRC = path.resolve(process.cwd(), 'src')
const HELPER = path.resolve(SRC, 'lib', 'network', 'fetchWithTimeout.ts')

function listSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listSourceFiles(full))
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full)
  }
  return out
}

/** Line numbers of real `fetch(` calls (comment lines are ignored). */
function rawFetchLines(file: string): number[] {
  const hits: number[] = []
  fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return
      if (/(?<![\w.$])fetch\s*\(/.test(line)) hits.push(index + 1)
    })
  return hits
}

describe('fetch deadlines', () => {
  it('calls fetch() only inside the shared timeout helper', () => {
    const offenders: string[] = []
    for (const file of listSourceFiles(SRC)) {
      if (path.resolve(file) === HELPER) continue
      const lines = rawFetchLines(file)
      if (lines.length > 0) {
        offenders.push(`${path.relative(SRC, file).replace(/\\/g, '/')}:${lines.join(',')}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('keeps the helper itself free of inline abort controllers', () => {
    const source = fs.readFileSync(HELPER, 'utf8')
    expect(source).toContain('export async function fetchBlobWithTimeout')
    expect(source).toContain('export async function fetchArrayBufferWithTimeout')
  })
})
