import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminI18nProvider } from '../../admin/src/lib/i18n'
import Devices from '../../admin/src/pages/Devices'

/**
 * The admin SPA lives outside the root vitest collection, so its regression
 * tests live here next to the other cross-package checks.
 */
const mocks = vi.hoisted(() => {
  class AdminApiError extends Error {
    status: number
    serverMessage?: string
    constructor(status: number, message?: string, serverMessage?: string) {
      super(message ?? 'Request failed')
      this.name = 'AdminApiError'
      this.status = status
      this.serverMessage = serverMessage
    }
  }
  return {
    AdminApiError,
    api: {
      getDevices: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      verify2FA: vi.fn(),
    },
  }
})

vi.mock('../../admin/src/api/client', () => mocks)

function renderDevices() {
  return render(
    <AdminI18nProvider>
      <Devices />
    </AdminI18nProvider>
  )
}

describe('admin devices page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state instead of an empty list', async () => {
    let resolveDevices: (value: { devices: unknown[]; total: number }) => void = () => {}
    mocks.api.getDevices.mockImplementation(
      () => new Promise((resolve) => { resolveDevices = resolve })
    )

    renderDevices()

    // The list must not pretend that there are no devices while the request
    // is still in flight.
    expect(await screen.findByText('Loading...', undefined, { timeout: 5000 })).toBeTruthy()
    expect(screen.queryByText('Chrome')).toBeNull()

    resolveDevices({ devices: [{ name: 'Chrome', count: 2, percentage: 40 }], total: 5 })
    expect(await screen.findByText('Chrome', undefined, { timeout: 5000 })).toBeTruthy()
  })

  it('shows the server message when the request fails', async () => {
    mocks.api.getDevices.mockRejectedValue(
      new mocks.AdminApiError(500, 'Request failed (500)', 'Backend exploded')
    )

    renderDevices()

    const alert = await screen.findByRole('alert', undefined, { timeout: 5000 })
    await waitFor(() => expect(alert.textContent).toContain('Backend exploded'))
  })

  it('retries on demand', async () => {
    mocks.api.getDevices.mockRejectedValue(
      new mocks.AdminApiError(500, 'Request failed (500)', 'Backend exploded')
    )

    renderDevices()

    const alert = await screen.findByRole('alert', undefined, { timeout: 5000 })
    const retry = await screen.findByRole('button', undefined, { timeout: 5000 })
    fireEvent.click(retry)

    await waitFor(() => expect(mocks.api.getDevices).toHaveBeenCalledTimes(2))
    expect(alert).toBeTruthy()
  })
})
