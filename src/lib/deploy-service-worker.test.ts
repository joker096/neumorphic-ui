import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Guards the service worker hand-off in the deploy pipeline.
 *
 * The service worker is the only file that must change bytes on every release:
 * a browser installs a new worker only when `sw.js` differs. The pipeline bumps
 * `CACHE_VERSION` at deploy time, i.e. AFTER the build has already produced the
 * pre-compressed `sw.js.gz` / `sw.js.br` twins. Uploading those untouched left
 * the previous release's worker on the server (nginx `gzip_static` serves the
 * packed copy), the browser saw an identical file, and every deploy shipped one
 * release behind: new assets on disk, old bundle in every installed client.
 */
const scriptPath = path.join(process.cwd(), 'scripts', 'deploy-all.ps1')

const script = (): string => fs.readFileSync(scriptPath, 'utf8')

const indexOfOrThrow = (haystack: string, needle: string): number => {
  const index = haystack.indexOf(needle)
  expect(index, `deploy-all.ps1 no longer contains: ${needle}`).toBeGreaterThan(-1)
  return index
}

describe('deploy-all.ps1 service worker hand-off', () => {
  it('re-compresses sw.js.gz and sw.js.br after bumping CACHE_VERSION', () => {
    const text = script()
    const bump = indexOfOrThrow(text, 'Bumping service-worker CACHE_VERSION')
    const gzWrite = indexOfOrThrow(text, 'z.gzipSync(data,{level:9})')
    const brWrite = indexOfOrThrow(text, 'z.brotliCompressSync(data)')

    // Both packed twins are rebuilt from the bumped file, never uploaded stale.
    expect(gzWrite).toBeGreaterThan(bump)
    expect(brWrite).toBeGreaterThan(bump)
    expect(text).toContain("foreach ($packExt in @('gz', 'br'))")
    // If the recompression fails the packed copy is dropped, so nginx falls back
    // to the plain (correct) sw.js instead of serving the previous release.
    expect(text).toContain('Remove-Item $packedSw -Force')
  })

  it('drops the remote pre-compressed worker before uploading the new release', () => {
    const text = script()
    const cleanup = indexOfOrThrow(text, 'rm -f $WebRoot/sw.js.gz $WebRoot/sw.js.br')
    const upload = indexOfOrThrow(text, 'Uploading web files')

    expect(cleanup).toBeLessThan(upload)
  })
})
