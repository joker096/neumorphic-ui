import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdminI18nProvider } from '../../admin/src/lib/i18n'
import { AuthProvider, useAuth } from '../../admin/src/hooks/useAuth'
import Verify2FA from '../../admin/src/pages/Verify2FA'

/**
 * The admin SPA lives outside the root vitest collection, so its regression
 * tests live here next to the other cross-package checks.
 */
const mocks = vi.hoisted(() => {
  class AdminApiError extends Error {
    status: number
    serverMessage?: string
    code?: string
    constructor(status: number, message: string, serverMessage?: string, code?: string) {
      super(message)
      this.name = 'AdminApiError'
      this.status = status
      this.serverMessage = serverMessage
      this.code = code
    }
  }
  return {
    AdminApiError,
    navigate: vi.fn(),
    api: {
      login: vi.fn(),
      verify2FA: vi.fn(),
      logout: vi.fn(),
    },
  }
})

vi.mock('../../admin/src/api/client', () => mocks)
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))

/** Shows the two-factor state and can start a two-factor session. */
function Probe() {
  const { needs2FA, login } = useAuth()
  return (
    <div>
      <span data-testid="needs-2fa">{String(needs2FA)}</span>
      <button type="button" onClick={() => { void login('admin', 'secret') }}>
        start
      </button>
    </div>
  )
}

function renderVerify2FA() {
  return render(
    <AdminI18nProvider>
      <AuthProvider>
        <Probe />
        <Verify2FA />
      </AuthProvider>
    </AdminI18nProvider>
  )
}

function fillCode(value = '123456') {
  const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
  value.split('').forEach((digit, index) => {
    fireEvent.change(inputs[index], { target: { value: digit } })
  })
}

/** Signs in far enough for the provider to hold a two-factor session. */
async function startTwoFactorSession() {
  // The admin locales load asynchronously: wait until the page is translated
  // before interacting with it.
  await screen.findByRole('heading', { name: 'Two-Factor Auth' })
  fireEvent.click(screen.getByRole('button', { name: 'start' }))
  await screen.findByText('true')
}

describe('admin two-factor screen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.api.login.mockResolvedValue({ sessionToken: 'session-1', requires2FA: true })
    mocks.api.verify2FA.mockResolvedValue({ token: 'admin-token' })
  })

  it('reports a wrong code as a wrong code', async () => {
    mocks.api.verify2FA.mockRejectedValue(
      new mocks.AdminApiError(401, 'Invalid 2FA code', 'Invalid 2FA code', 'invalid_code')
    )

    const { container } = renderVerify2FA()
    await startTwoFactorSession()
    fillCode()
    const form = container.querySelector('form')
    fireEvent.submit(form as HTMLFormElement)

    expect(await screen.findByText('Invalid verification code')).toBeTruthy()
  })

  it('reports an expired session instead of blaming the code', async () => {
    mocks.api.verify2FA.mockRejectedValue(
      new mocks.AdminApiError(
        401,
        'Invalid or expired session token',
        'Invalid or expired session token',
        'session_expired'
      )
    )

    const { container } = renderVerify2FA()
    await startTwoFactorSession()
    fillCode()
    const form = container.querySelector('form')
    fireEvent.submit(form as HTMLFormElement)

    expect(await screen.findByText('The sign-in session expired. Please sign in again.')).toBeTruthy()
  })

  it('lets the operator leave the two-factor step', async () => {
    const { container } = renderVerify2FA()

    fireEvent.click(screen.getByRole('button', { name: 'start' }))
    await screen.findByText('true')

    const back = await screen.findByRole('button', { name: 'Back to login' })
    fireEvent.click(back)

    expect(mocks.navigate).toHaveBeenCalledWith('/login')
    expect(await screen.findByText('false')).toBeTruthy()
    expect(container.querySelector('form')).toBeTruthy()
  })
})
