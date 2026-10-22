import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Guards the CI gates that silently stopped working.
 *
 * The security workflow used ESLint 8 command line flags
 * (`--plugin security --rule 'plugin:security/recommended'`). ESLint 9 and
 * 10 use flat config, where those flags are rejected - the step failed before
 * it linted a single file. The audit step also failed on the dev-only
 * Android build chain, whose advisories have no fixed version.
 */
const WORKFLOW_DIR = path.join(process.cwd(), '.github', 'workflows')

const readWorkflow = (name: string): string =>
  fs.readFileSync(path.join(WORKFLOW_DIR, name), 'utf8')

/** The `run:` lines of a workflow - the commands CI actually executes. */
const runCommands = (yaml: string): string[] =>
  yaml
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('run:'))
    .map((line) => line.slice('run:'.length).trim())

describe('CI workflow gates', () => {
  it('lints with the flat config instead of the removed ESLint 8 flags', () => {
    const commands = runCommands(readWorkflow('security.yml'))
    expect(commands.length).toBeGreaterThan(0)
    for (const command of commands) {
      expect(command).not.toContain('--plugin')
      expect(command).not.toContain('--rule')
    }
    expect(commands).toContain('npx eslint .')
  })

  it('gates npm audit on the production dependency tree', () => {
    const commands = runCommands(readWorkflow('security.yml'))
    expect(commands).toContain('npm audit --omit=dev --audit-level=high')
  })

  it('type-checks the admin SPA in the CI test job', () => {
    expect(runCommands(readWorkflow('ci.yml'))).toContain('npm run lint:admin')
  })
})
