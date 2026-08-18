import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_LOCALES = path.resolve(__dirname, '../locales')
const LANDING_LOCALES = path.resolve(__dirname, '../../public/landing/lang')

function langCodes(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
    .sort()
}

/**
 * K5 i18n unification guard. The app (src/locales) and the marketing landing
 * (public/landing/lang) are two separate bundles; they MUST still expose the
 * same set of languages so a user never loses their locale when moving between
 * the SPA and the landing page. `public/lang` (root) was a byte-identical
 * duplicate of `public/landing/lang` and has been removed.
 */
describe('i18n consistency (app vs landing)', () => {
  const appLangs = langCodes(APP_LOCALES)
  const landingLangs = langCodes(LANDING_LOCALES)

  it('exposes at least the core languages', () => {
    expect(appLangs).toContain('en')
    expect(landingLangs).toContain('en')
  })

  it('landing supports exactly the same languages as the app', () => {
    expect(landingLangs).toEqual(appLangs)
  })
})
