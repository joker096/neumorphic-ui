import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Loads the process environment for the server.
 *
 * Precedence — the first source that defines a key wins (dotenv never
 * overrides an already-set variable):
 *   1. `<repo root>/.env`        – the file the deploy scripts source; pm2
 *                                   inherits it, so production resolves here
 *   2. `<repo root>/server/.env`  – per-service fallback for keys the root file
 *                                   does not define
 *   3. `<cwd>/.env`               – legacy location (the server used to read
 *                                   only this, so a server started from another
 *                                   directory silently missed every variable)
 *
 * Every module that reads `process.env` at module scope must import this file
 * first, otherwise the value is read before dotenv has populated the
 * environment (that is how `DB_PATH` used to be ignored).
 */
export function loadEnv(rootDir = path.resolve(__dirname, '..'), cwd = process.cwd()): void {
  dotenv.config({ path: path.join(rootDir, '.env') })
  dotenv.config({ path: path.join(rootDir, 'server', '.env') })
  dotenv.config({ path: path.join(cwd, '.env') })
}

loadEnv()
