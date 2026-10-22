import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRateLimiter, ipRateLimitKey, adminRateLimitKey } from '../middleware/rateLimit.js'

afterEach(() => {
  vi.useRealTimers()
})

describe('createRateLimiter', () => {
  it('spends the budget of a key and then refuses', () => {
    const limiter = createRateLimiter(3, 60_000)
    expect(limiter.check('a')).toBe(true)
    expect(limiter.check('a')).toBe(true)
    expect(limiter.check('a')).toBe(true)
    expect(limiter.check('a')).toBe(false)
  })

  it('keeps the buckets of different keys apart', () => {
    const limiter = createRateLimiter(1, 60_000)
    expect(limiter.check('a')).toBe(true)
    expect(limiter.check('b')).toBe(true)
    expect(limiter.check('a')).toBe(false)
    expect(limiter.size()).toBe(2)
  })

  it('starts a fresh window once the previous one expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const limiter = createRateLimiter(1, 1000)
    expect(limiter.check('a')).toBe(true)
    expect(limiter.check('a')).toBe(false)
    vi.setSystemTime(new Date('2026-01-01T00:00:02Z'))
    expect(limiter.check('a')).toBe(true)
  })

  it('sweeps expired buckets once the map grew', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const limiter = createRateLimiter(5, 1000)
    for (let i = 0; i < 1024; i += 1) limiter.check('k' + i)
    expect(limiter.size()).toBe(1024)
    vi.setSystemTime(new Date('2026-01-01T00:00:05Z'))
    limiter.check('fresh')
    expect(limiter.size()).toBe(1)
  })

  it('reset() drops every bucket', () => {
    const limiter = createRateLimiter(1, 60_000)
    limiter.check('a')
    expect(limiter.size()).toBe(1)
    limiter.reset()
    expect(limiter.size()).toBe(0)
    expect(limiter.check('a')).toBe(true)
  })
})

describe('bucket keys', () => {
  it('separates anonymous traffic from administrators', () => {
    expect(ipRateLimitKey('127.0.0.1')).toBe('ip:127.0.0.1')
    expect(adminRateLimitKey(7)).toBe('admin:7')
    expect(ipRateLimitKey('127.0.0.1')).not.toBe(adminRateLimitKey(7))
  })
})
