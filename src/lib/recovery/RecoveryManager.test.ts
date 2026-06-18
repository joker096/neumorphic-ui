import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../deviceSecurity', () => ({
  deviceSecurity: {
    storeMasterKeyHex: vi.fn(),
  }
}))

vi.mock('../../store', () => ({
  setSessionMasterKey: vi.fn(),
}))

describe('RecoveryManager security', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should store PBKDF2-derived hash with salt in localStorage', async () => {
    const { RecoveryManager } = await import('./RecoveryManager')
    await RecoveryManager.generateRecoveryPhrase()
    const storedHash = localStorage.getItem('app_recovery_hash')
    expect(storedHash).not.toBeNull()
    expect(storedHash).toContain(':')
    const [saltHex, derivedHex] = storedHash!.split(':')
    expect(saltHex).toHaveLength(32)
    expect(derivedHex).toHaveLength(64)
  })

  it('should use different salt on each generation', async () => {
    const { RecoveryManager } = await import('./RecoveryManager')
    await RecoveryManager.generateRecoveryPhrase()
    const stored1 = localStorage.getItem('app_recovery_hash')!
    localStorage.clear()
    await RecoveryManager.generateRecoveryPhrase()
    const stored2 = localStorage.getItem('app_recovery_hash')!
    const salt1 = stored1.split(':')[0]
    const salt2 = stored2.split(':')[0]
    expect(salt1).not.toBe(salt2)
  })

  it('should verify correct phrase with PBKDF2', async () => {
    const { RecoveryManager } = await import('./RecoveryManager')
    const phrase = await RecoveryManager.generateRecoveryPhrase()
    const result = await RecoveryManager.restoreFromPhrase(phrase)
    expect(result).toBe(true)
  })

  it('should reject incorrect phrase', async () => {
    const { RecoveryManager } = await import('./RecoveryManager')
    await RecoveryManager.generateRecoveryPhrase()
    const result = await RecoveryManager.restoreFromPhrase('abandon ability able about above absent absorb absolutely absorb abyss')
    expect(result).toBe(false)
  })
})
