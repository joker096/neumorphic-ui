import { describe, it, expect } from 'vitest'

describe('Ads', () => {
  it('should track impressions and clicks', () => {
    const events: Array<{ adId: number; type: string }> = []

    function trackImpression(adId: number) { events.push({ adId, type: 'impression' }) }
    function trackClick(adId: number) { events.push({ adId, type: 'click' }) }

    trackImpression(1)
    trackImpression(1)
    trackClick(1)

    const impressions = events.filter(e => e.type === 'impression').length
    const clicks = events.filter(e => e.type === 'click').length

    expect(impressions).toBe(2)
    expect(clicks).toBe(1)
  })

  it('should find active ad', () => {
    const ads = [
      { id: 1, title: 'Old', active: 0, updated_at: '2024-01-01' },
      { id: 2, title: 'Active', active: 1, updated_at: '2024-06-01' },
    ]
    const active = ads.filter(a => a.active === 1).sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at)
    )[0]
    expect(active?.title).toBe('Active')
  })

  it('should validate ad fields', () => {
    function validate(data: any): string | null {
      if (!data.title || !data.image_url || !data.target_url) return 'missing fields'
      return null
    }
    expect(validate({ title: 'Ad', image_url: 'img', target_url: 'url' })).toBeNull()
    expect(validate({ title: 'Ad', image_url: 'img' })).toBe('missing fields')
    expect(validate({})).toBe('missing fields')
  })
})
