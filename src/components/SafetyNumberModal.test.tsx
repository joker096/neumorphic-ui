import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { SafetyNumberModal } from './SafetyNumberModal'

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
  }),
}))

const MY_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
const THEIR_KEY = 'f0e1d2c3b4a5968778695a4b3c2d1e0ff0e1d2c3b4a5968778695a4b3c2d1e0f'

const baseProps = {
  open: true,
  contactId: 'hash_chat_999',
  contactName: 'Alice',
  theme: 'light' as const,
  onClose: vi.fn(),
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const groups = () => document.body.querySelectorAll('span.tracking-wider')
const idBlocks = () => document.body.querySelectorAll('div.font-mono')

describe('SafetyNumberModal', () => {
  it('shows unverified state (no groups) until the peer identity is pinned', async () => {
    render(<SafetyNumberModal {...baseProps} myPeerId={MY_KEY} />)
    await waitFor(() => expect(groups().length).toBe(0))
  })

  it('theirId row falls back to contact id when no pinned identity', async () => {
    render(
      <SafetyNumberModal {...baseProps} myPeerId={MY_KEY} contactId="hash_chat_999" />,
    )
    await waitFor(() => expect(idBlocks()[0].textContent).toContain('hash_chat_999'))
  })

  it('renders without throwing for numeric (legacy chat) contact id', async () => {
    render(<SafetyNumberModal {...baseProps} myPeerId={MY_KEY} contactId={5 as unknown as string} />)
    await waitFor(() => expect(groups().length).toBe(0))
    expect(idBlocks()[0].textContent).toContain('5')
  })

  it('renders without throwing for numeric myPeerId', async () => {
    render(<SafetyNumberModal {...baseProps} myPeerId={7 as unknown as string} />)
    await waitFor(() => expect(groups().length).toBe(0))
  })

  it('theirId row shows the pinned identity key when available', async () => {
    render(<SafetyNumberModal {...baseProps} myPeerId={MY_KEY} theirPublicKey={THEIR_KEY} />)
    await waitFor(() => expect(idBlocks()[0].textContent).toContain(THEIR_KEY.slice(0, 16)))
  })

  it('close button triggers onClose', async () => {
    const onClose = vi.fn()
    render(<SafetyNumberModal {...baseProps} onClose={onClose} />)
    const closeBtn = await waitFor(() =>
      Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent === 'contacts.close',
      ),
    )
    fireEvent.click(closeBtn as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders 12 safety-number groups when both identity keys are known', async () => {
    render(<SafetyNumberModal {...baseProps} myPeerId={MY_KEY} theirPublicKey={THEIR_KEY} />)
    await waitFor(() => expect(groups().length).toBe(12))
    expect(groups()[0].textContent).toMatch(/^[0-9A-F]{5}$/)
  })
})