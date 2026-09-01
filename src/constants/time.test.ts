import { describe, it, expect } from 'vitest'
import { MINUTE_MS, HOUR_MS, DAY_MS, ACTIVE_NOW_THRESHOLD_MS } from './time'

describe('time constants', () => {
  it('defines base duration constants in milliseconds', () => {
    expect(MINUTE_MS).toBe(60000)
    expect(HOUR_MS).toBe(3600000)
    expect(DAY_MS).toBe(86400000)
  })

  it('exposes an active-now threshold equal to one minute', () => {
    expect(ACTIVE_NOW_THRESHOLD_MS).toBe(MINUTE_MS)
  })

  it('keeps unit relationships consistent', () => {
    expect(HOUR_MS).toBe(60 * MINUTE_MS)
    expect(DAY_MS).toBe(24 * HOUR_MS)
  })
})