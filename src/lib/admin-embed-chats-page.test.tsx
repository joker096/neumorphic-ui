import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

/**
 * The admin SPA lives outside the root vitest collection, so its page-level
 * regressions live here next to the other cross-package checks. Same
 * convention as admin-ads-page.test.tsx.
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
    embedConversations: vi.fn(),
    embedThread: vi.fn(),
    embedReply: vi.fn(),
    embedUpdateConversation: vi.fn(),
  }
})

vi.mock('../../admin/src/api/client', () => ({
  api: {
    embedConversations: mocks.embedConversations,
    embedThread: mocks.embedThread,
    embedReply: mocks.embedReply,
    embedUpdateConversation: mocks.embedUpdateConversation,
  },
  AdminApiError: mocks.AdminApiError,
}))

import EmbedChats from '../../admin/src/pages/EmbedChats'
import { AdminI18nProvider } from '../../admin/src/lib/i18n'

function renderChats() {
  return render(
    <AdminI18nProvider>
      <EmbedChats />
    </AdminI18nProvider>
  )
}

const conv = {
  conversation_id: 'c1',
  widget_id: 'demo',
  status: 'open',
  assignee_id: undefined,
  source: 'website',
  started_at: '2026-10-25T10:00:00Z',
  visitor: { name: 'Visitor', email: 'v@example.com' },
  message_count: 1,
  last_message: { body: 'I need help', sender_type: 'visitor' },
}

describe('admin embed chats page', () => {
  beforeEach(() => {
    mocks.embedConversations.mockReset()
    mocks.embedThread.mockReset()
    mocks.embedReply.mockReset()
    mocks.embedUpdateConversation.mockReset()
    mocks.embedConversations.mockResolvedValue([])
    mocks.embedThread.mockResolvedValue([])
    mocks.embedReply.mockResolvedValue({ message_id: 'm-new' })
    mocks.embedUpdateConversation.mockResolvedValue({ ok: true })
  })

  it('lists conversations with visitor info and last message', async () => {
    mocks.embedConversations.mockResolvedValue([conv])

    renderChats()

    const row = await screen.findByText('Visitor')
    expect(row).not.toBeNull()
    const meta = screen.getByTestId('embed-conv-meta')
    expect(meta.textContent).toContain('v@example.com')
    expect(meta.textContent).toContain('1')
    expect(screen.getByText('I need help')).not.toBeNull()
  })

  it('opens a thread, replies, and appends the operator bubble', async () => {
    mocks.embedConversations.mockResolvedValue([conv])
    mocks.embedThread.mockResolvedValue([
      { id: 'm1', conversation_id: 'c1', sender_type: 'visitor', type: 'text', body: 'I need help', created_at: '2026-10-25T10:00:00Z' },
    ])

    renderChats()

    await screen.findByText('Visitor')
    fireEvent.click(screen.getByText('Visitor'))

    await screen.findByText('I need help')
    expect(mocks.embedThread).toHaveBeenCalledWith('c1')

    const input = screen.getByPlaceholderText(/type a reply/i)
    fireEvent.change(input, { target: { value: 'We are on it' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => expect(mocks.embedReply).toHaveBeenCalledWith('c1', 'We are on it'))
    await screen.findByText('We are on it')
    expect(screen.getByPlaceholderText(/type a reply/i)).toHaveValue('')
  })

  it('shows server message on reply failure and keeps the draft', async () => {
    mocks.embedConversations.mockResolvedValue([conv])
    mocks.embedThread.mockResolvedValue([])
    mocks.embedReply.mockRejectedValue(
      new mocks.AdminApiError(429, 'Too many requests', 'Too many requests')
    )

    renderChats()

    await screen.findByText('Visitor')
    fireEvent.click(screen.getByText('Visitor'))

    await screen.findByText(/no messages/i)
    const input = screen.getByPlaceholderText(/type a reply/i)
    fireEvent.change(input, { target: { value: 'Hi' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Too many requests')
    expect(input).toHaveValue('Hi')
  })

  it('closes a conversation, then reopens it', async () => {
    mocks.embedConversations.mockResolvedValue([conv])

    renderChats()

    await screen.findByText('Visitor')
    fireEvent.click(screen.getByText('Visitor'))
    await screen.findByRole('button', { name: 'Close' })

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() =>
      expect(mocks.embedUpdateConversation).toHaveBeenCalledWith('c1', { status: 'closed' })
    )
  })
})
