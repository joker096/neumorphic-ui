import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

/**
 * The admin SPA lives outside the root vitest collection, so its page-level
 * regressions live here next to the other cross-package checks.
 *
 * The mocked module must expose a REAL `AdminApiError` class: the error helper
 * matches with `instanceof`, so a plain object would slip past it.
 */
const mocks = vi.hoisted(() => {
  class AdminApiError extends Error {
    status: number
    serverMessage?: string
    constructor(status: number, message: string, serverMessage?: string) {
      super(message)
      this.name = 'AdminApiError'
      this.status = status
      this.serverMessage = serverMessage
    }
  }
  return {
    AdminApiError,
    getAds: vi.fn(),
    createAd: vi.fn(),
    updateAd: vi.fn(),
    deleteAd: vi.fn(),
  }
})

vi.mock('../../admin/src/api/client', () => ({
  api: {
    getAds: mocks.getAds,
    createAd: mocks.createAd,
    updateAd: mocks.updateAd,
    deleteAd: mocks.deleteAd,
  },
  AdminApiError: mocks.AdminApiError,
}))

import Ads from '../../admin/src/pages/Ads'
import { AdminI18nProvider } from '../../admin/src/lib/i18n'

function renderAds() {
  return render(
    <AdminI18nProvider>
      <Ads />
    </AdminI18nProvider>
  )
}

async function openNewAdForm() {
  // The admin SPA loads its locale chunk asynchronously. On a loaded machine
  // the label is still the translation key when the default 1s budget expires
  // - a slow environment is not a finding.
  const button = await screen.findByRole('button', { name: /new ad/i }, { timeout: 10_000 })
  fireEvent.click(button)
  await screen.findByPlaceholderText('Title')
}

function fill(title: string, image: string, target: string) {
  fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: title } })
  fireEvent.change(screen.getByPlaceholderText('Image URL'), { target: { value: image } })
  fireEvent.change(screen.getByPlaceholderText('Target URL'), { target: { value: target } })
}

describe('admin ads page', () => {
  beforeEach(() => {
    mocks.getAds.mockReset()
    mocks.createAd.mockReset()
    mocks.updateAd.mockReset()
    mocks.deleteAd.mockReset()
    mocks.getAds.mockResolvedValue({ ads: [] })
  })

  it('keeps the form open and shows the server message when creating an ad fails', async () => {
    mocks.createAd.mockRejectedValue(
      new mocks.AdminApiError(429, 'Too many requests', 'Too many requests')
    )

    renderAds()
    await openNewAdForm()
    fill('Spring sale', 'https://img.example/a.png', 'https://example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Too many requests')
    // the operator keeps the half-filled form instead of losing the input
    expect(screen.queryByPlaceholderText('Title')).not.toBeNull()
    expect(mocks.createAd).toHaveBeenCalledTimes(1)
  })

  it('closes the form and reloads the list after a successful create', async () => {
    mocks.createAd.mockResolvedValue({ id: 7 })

    renderAds()
    await openNewAdForm()
    fill('Spring sale', 'https://img.example/a.png', 'https://example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(mocks.getAds).toHaveBeenCalledTimes(2))
    expect(screen.queryByPlaceholderText('Title')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('reports a failed toggle without dropping the ad from the list', async () => {
    mocks.getAds.mockResolvedValue({
      ads: [
        {
          id: 7,
          title: 'Spring sale',
          image_url: 'https://img.example/a.png',
          target_url: 'https://example.com',
          active: 1,
          impressions: 10,
          clicks: 1,
          created_at: '2026-10-22T10:00:00Z',
          updated_at: '2026-10-22T10:00:00Z',
        },
      ],
    })
    mocks.updateAd.mockRejectedValue(
      new mocks.AdminApiError(500, 'Request failed (500)', 'Ad update failed')
    )

    renderAds()

    await screen.findByText('Spring sale')
    fireEvent.click(screen.getByRole('button', { name: 'Active' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Ad update failed')
    expect(screen.queryByText('Spring sale')).not.toBeNull()
  })
})
