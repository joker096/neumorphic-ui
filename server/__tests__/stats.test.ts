import { describe, it, expect } from 'vitest'

describe('Stats Utils', () => {
  it('should parse OS from user agent', () => {
    const agents: Array<{ ua: string; expected: string }> = [
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', expected: 'Windows' },
      { ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/120', expected: 'Android' },
      { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/605', expected: 'iOS' },
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14) Safari/605', expected: 'macOS' },
      { ua: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/120', expected: 'Linux' },
      { ua: 'Some random agent', expected: 'Other' },
    ]

    function parseOS(ua: string): string {
      if (ua.includes('Windows')) return 'Windows'
      if (ua.includes('Android')) return 'Android'
      if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) return 'iOS'
      if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macOS'
      if (ua.includes('Linux')) return 'Linux'
      if (ua.includes('CrOS')) return 'ChromeOS'
      return 'Other'
    }

    for (const { ua, expected } of agents) {
      expect(parseOS(ua)).toBe(expected)
    }
  })

  it('should calculate device percentages', () => {
    const rows = [
      'Windows', 'Windows', 'Android', 'iOS', 'macOS', 'Windows', 'Android',
    ]
    const osCount: Record<string, number> = {}
    for (const os of rows) {
      osCount[os] = (osCount[os] || 0) + 1
    }
    const total = rows.length
    const devices = Object.entries(osCount).map(([name, count]) => ({
      name, count, percentage: Math.round((count / total) * 100),
    })).sort((a, b) => b.count - a.count)

    expect(devices[0]!.name).toBe('Windows')
    expect(devices[0]!.percentage).toBe(43)
    expect(total).toBe(7)
  })

  it('should aggregate countries', () => {
    const rows = [
      { country: 'US' }, { country: 'DE' }, { country: 'US' }, { country: 'JP' },
    ]
    const agg: Record<string, number> = {}
    for (const r of rows) {
      if (r.country) agg[r.country] = (agg[r.country] || 0) + 1
    }
    expect(agg['US']).toBe(2)
    expect(agg['DE']).toBe(1)
    expect(agg['JP']).toBe(1)
  })
})
