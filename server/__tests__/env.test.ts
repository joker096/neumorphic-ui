import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadEnv } from '../env.js'

const ROOT_KEY = 'MESSANGER_ENV_TEST_ROOT'
const SERVER_KEY = 'MESSANGER_ENV_TEST_SERVER'
const CWD_KEY = 'MESSANGER_ENV_TEST_CWD'
const ABSENT_KEY = 'MESSANGER_ENV_TEST_ABSENT'

const KEYS = [ROOT_KEY, SERVER_KEY, CWD_KEY, ABSENT_KEY]

describe('server env loading', () => {
  let root: string
  let cwd: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'messanger-env-root-'))
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'messanger-env-cwd-'))
    fs.mkdirSync(path.join(root, 'server'), { recursive: true })
    for (const key of KEYS) delete process.env[key]
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
    fs.rmSync(cwd, { recursive: true, force: true })
    for (const key of KEYS) delete process.env[key]
  })

  it('prefers the repo-root .env over the server fallback', () => {
    fs.writeFileSync(path.join(root, '.env'), `${ROOT_KEY}=root\n${SERVER_KEY}=from-root\n`)
    fs.writeFileSync(path.join(root, 'server', '.env'), `${SERVER_KEY}=from-server\n`)

    loadEnv(root, cwd)

    expect(process.env[ROOT_KEY]).toBe('root')
    expect(process.env[SERVER_KEY]).toBe('from-root')
  })

  it('fills a missing key from the server .env', () => {
    fs.writeFileSync(path.join(root, '.env'), `${ROOT_KEY}=root\n`)
    fs.writeFileSync(path.join(root, 'server', '.env'), `${SERVER_KEY}=from-server\n`)

    loadEnv(root, cwd)

    expect(process.env[SERVER_KEY]).toBe('from-server')
  })

  it('falls back to the legacy working-directory .env', () => {
    fs.writeFileSync(path.join(cwd, '.env'), `${CWD_KEY}=from-cwd\n`)

    loadEnv(root, cwd)

    expect(process.env[CWD_KEY]).toBe('from-cwd')
  })

  it('leaves a key undefined when no file defines it', () => {
    fs.writeFileSync(path.join(root, '.env'), `${ROOT_KEY}=root\n`)

    loadEnv(root, cwd)

    expect(process.env[ABSENT_KEY]).toBeUndefined()
  })

  it('never overrides a value that is already in the environment', () => {
    process.env[ROOT_KEY] = 'from-process'
    fs.writeFileSync(path.join(root, '.env'), `${ROOT_KEY}=from-root\n`)

    loadEnv(root, cwd)

    expect(process.env[ROOT_KEY]).toBe('from-process')
  })
})
