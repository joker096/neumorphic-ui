import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AdBanner } from './AdBanner'

const mockAd = {
  id: 1,
  title: 'Summer Sale — 50% Off',
  image_url: 'https://example.com/banner.png',
  target_url: 'https://example.com/sale',
}

describe('AdBanner', () => {
  const fetchSpy = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should render nothing when no active ad', async () => {
    fetchSpy.mockResolvedValue({ json: () => Promise.resolve({ ad: null }) })
    const { container } = render(<AdBanner />)
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled()
    })
    expect(container.innerHTML).toBe('')
  })

  it('should render ad banner when active ad exists', async () => {
    fetchSpy.mockResolvedValue({ json: () => Promise.resolve({ ad: mockAd }) })
    render(<AdBanner />)
    await waitFor(() => {
      expect(screen.getByText('Summer Sale — 50% Off')).toBeTruthy()
    })
  })

  it('should track impression on render', async () => {
    fetchSpy.mockResolvedValue({ json: () => Promise.resolve({ ad: mockAd }) })
    render(<AdBanner />)
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/ads/1/impression'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('should track click and open URL on click', async () => {
    const openSpy = vi.fn()
    vi.stubGlobal('open', openSpy)

    fetchSpy.mockResolvedValue({ json: () => Promise.resolve({ ad: mockAd }) })
    render(<AdBanner />)
    await waitFor(() => {
      expect(screen.getByText('Summer Sale — 50% Off')).toBeTruthy()
    })

    screen.getByText('Summer Sale — 50% Off').click()
    expect(openSpy).toHaveBeenCalledWith('https://example.com/sale', '_blank')
  })
})
