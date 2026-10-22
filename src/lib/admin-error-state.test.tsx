import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminApiError } from '../../admin/src/api/client'
import { adminErrorMessage, isSessionLost } from '../../admin/src/lib/errorMessage'
import { AdminI18nProvider } from '../../admin/src/lib/i18n'
import ErrorState from '../../admin/src/components/ErrorState'

/**
 * The admin SPA lives outside the root vitest collection, so its regression
 * tests live here next to the other cross-package checks.
 */
describe('admin error state', () => {
  it('detects a lost session so the page does not show an error over the login screen', () => {
    expect(isSessionLost(new Error('Unauthorized'))).toBe(true)
    expect(isSessionLost(new Error('boom'))).toBe(false)
    expect(isSessionLost('boom')).toBe(false)
  })

  it('keeps the server message of a failed request', () => {
    expect(adminErrorMessage(new AdminApiError(429, 'Too many requests', 'Too many requests'))).toBe('Too many requests')
    expect(adminErrorMessage(new AdminApiError(500, 'Request failed (500)'))).toBeUndefined()
    expect(adminErrorMessage(new Error('boom'))).toBeUndefined()
  })

  it('shows the server message and retries on demand', async () => {
    const onRetry = vi.fn()
    render(
      <AdminI18nProvider>
        <ErrorState message="Too many requests" onRetry={onRetry} />
      </AdminI18nProvider>
    )

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Too many requests')

    const button = await screen.findByRole('button')
    button.click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('falls back to a localized message when the server sent none', async () => {
    render(
      <AdminI18nProvider>
        <ErrorState />
      </AdminI18nProvider>
    )

    const alert = await screen.findByRole('alert')
    await waitFor(() => expect(alert.textContent).toContain('Failed to load data'))
    expect(screen.queryByRole('button')).toBeNull()
  })
})
