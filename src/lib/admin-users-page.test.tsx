import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

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
  return { AdminApiError, getUsers: vi.fn() }
})

vi.mock('../../admin/src/api/client', () => ({
  api: { getUsers: mocks.getUsers },
  AdminApiError: mocks.AdminApiError,
}))

import Users from '../../admin/src/pages/Users'
import { AdminI18nProvider } from '../../admin/src/lib/i18n'

function renderUsers() {
  return render(
    <AdminI18nProvider>
      <Users />
    </AdminI18nProvider>
  )
}

describe('admin users page', () => {
  beforeEach(() => {
    mocks.getUsers.mockReset()
  })

  it('shows the server message instead of an empty table when the load fails', async () => {
    mocks.getUsers.mockRejectedValue(new mocks.AdminApiError(429, 'Too many requests', 'Too many requests'))

    renderUsers()

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Too many requests')
    // the table stays empty, the operator sees why
    expect(screen.queryAllByRole('row')).toHaveLength(1)
  })

  it('re-requests the page when the operator retries', async () => {
    mocks.getUsers.mockRejectedValue(new mocks.AdminApiError(500, 'Request failed (500)'))

    renderUsers()

    const button = await screen.findByRole('button', { name: /retry/i })
    expect(mocks.getUsers).toHaveBeenCalledTimes(1)
    button.click()

    await waitFor(() => expect(mocks.getUsers).toHaveBeenCalledTimes(2))
  })

  it('renders the loaded users', async () => {
    mocks.getUsers.mockResolvedValue({
      users: [{ public_key: 'abcdef0123456789', country: 'DE', ip: '10.0.0.1', is_online: 1, last_seen: '2026-10-22T10:00:00Z' }],
      total: 1,
      page: 1,
      limit: 50,
    })

    renderUsers()

    await waitFor(() => expect(screen.getByText('abcdef0123456789...')).toBeTruthy())
    expect(screen.getByText('DE')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not show an error banner when the session was lost', async () => {
    mocks.getUsers.mockRejectedValue(new Error('Unauthorized'))

    renderUsers()

    await waitFor(() => expect(mocks.getUsers).toHaveBeenCalled())
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
