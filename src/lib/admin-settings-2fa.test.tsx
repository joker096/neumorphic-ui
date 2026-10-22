import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => {
  class AdminApiError extends Error {
    status: number
    serverMessage?: string
    constructor(status: number, message?: string, serverMessage?: string) {
      super(message ?? 'error')
      this.status = status
      this.serverMessage = serverMessage
    }
  }
  return { reset2FA: vi.fn(), AdminApiError }
})

vi.mock('../../admin/src/api/client', () => ({
  api: { reset2FA: mocks.reset2FA },
  AdminApiError: mocks.AdminApiError,
}))

import { AdminI18nProvider } from '../../admin/src/lib/i18n'
import Settings from '../../admin/src/pages/Settings'

function renderSettings() {
  return render(
    <AdminI18nProvider>
      <Settings />
    </AdminI18nProvider>,
  )
}

describe('admin settings — reset 2FA', () => {
  beforeEach(() => {
    mocks.reset2FA.mockReset()
    window.confirm = vi.fn(() => true)
  })

  it('shows the new secret returned by the server', async () => {
    mocks.reset2FA.mockResolvedValue({ secret: 'NEWSECRET42', uri: 'otpauth://totp/admin' })

    renderSettings()
    fireEvent.click(await screen.findByRole('button', { name: /reset 2fa/i }, { timeout: 10_000 }))

    await waitFor(() => expect(screen.getByText('NEWSECRET42')).toBeInTheDocument(), { timeout: 10_000 })
    expect(mocks.reset2FA).toHaveBeenCalledTimes(1)
  })

  it('shows the server message when the reset fails', async () => {
    mocks.reset2FA.mockRejectedValue(
      new mocks.AdminApiError(
        429,
        'Too many attempts. Try again later.',
        'Too many attempts. Try again later.',
      ),
    )

    renderSettings()
    fireEvent.click(await screen.findByRole('button', { name: /reset 2fa/i }, { timeout: 10_000 }))

    await waitFor(
      () => expect(screen.getByText('Too many attempts. Try again later.')).toBeInTheDocument(),
      { timeout: 10_000 },
    )
    expect(screen.queryByText(/NEWSECRET42/)).toBeNull()
  })
})
