import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminI18nProvider } from '../../admin/src/lib/i18n'
import { AuthProvider } from '../../admin/src/hooks/useAuth'
import Login from '../../admin/src/pages/Login'

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
      login: vi.fn(),
      logout: vi.fn(),
      verify2FA: vi.fn(),
    },
  }
})

vi.mock('../../admin/src/api/client', () => mocks)
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))

function renderLogin() {
  return render(
    <AdminI18nProvider>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </AdminI18nProvider>
  )
}

describe('admin login captcha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.api.login.mockResolvedValue({
      needsCaptcha: true,
      sessionId: 'session-1',
      challenge: '2+3',
    })
  })

  it('reports why the verification code could not be loaded', async () => {
    mocks.api.login.mockRejectedValue(
      new mocks.AdminApiError(429, 'Too many requests', 'Too many requests')
    )

    renderLogin()

    expect(await screen.findByText('Too many requests', undefined, { timeout: 5000 })).toBeTruthy()
  }, 15000)

  it('falls back to a localized message when the server sent none', async () => {
    mocks.api.login.mockRejectedValue(new Error('Failed to fetch'))

    renderLogin()

    const messages = await screen.findAllByText(/could not be loaded/i, undefined, { timeout: 5000 })
    expect(messages.length).toBeGreaterThan(0)
  }, 15000)

  it('does not ignore the submit when no challenge is loaded', async () => {
    mocks.api.login.mockRejectedValue(new Error('Failed to fetch'))

    const { container } = renderLogin()
    await screen.findAllByText(/could not be loaded/i, undefined, { timeout: 5000 })

    const callsBefore = mocks.api.login.mock.calls.length
    const form = container.querySelector('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form as HTMLFormElement)

    // The submit asks for a fresh challenge instead of doing nothing silently.
    await waitFor(() => expect(mocks.api.login.mock.calls.length).toBeGreaterThan(callsBefore))
    const messages = await screen.findAllByText(/could not be loaded/i, undefined, { timeout: 5000 })
    expect(messages.length).toBeGreaterThan(0)
  }, 15000)
})
