import { describe, it, expect } from 'vitest'
import { generateCaptchaChallenge, verifyCaptcha } from '../routes/auth'

describe('Captcha challenge/verify', () => {
  it('returns the computed answer, not a placeholder', () => {
    const c = generateCaptchaChallenge()
    expect(c.challenge).toMatch(/^\d+ [+\-×] \d+ = \?$/)
    expect(c.answer).not.toBe(-1)
    expect(Number.isFinite(c.answer)).toBe(true)
    expect(verifyCaptcha(c.sessionId, c.answer)).toBe(true)
  })

  it('rejects a wrong answer', () => {
    const c = generateCaptchaChallenge()
    expect(verifyCaptcha(c.sessionId, c.answer + 1)).toBe(false)
  })

  it('rejects an unknown session', () => {
    expect(verifyCaptcha('missing-session', 0)).toBe(false)
  })

  it('session is single-use', () => {
    const c = generateCaptchaChallenge()
    verifyCaptcha(c.sessionId, c.answer)
    expect(verifyCaptcha(c.sessionId, c.answer)).toBe(false)
  })
})
