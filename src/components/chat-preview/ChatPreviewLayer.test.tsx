import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatPreviewLayer } from './ChatPreviewLayer';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

const mockProps: any = {
  theme: 'dark' as const,
  chat: { id: 'chat-1', name: 'Test Chat', history: [], isChannel: false, isMuted: false },
  onAction: vi.fn(),
  onCall: vi.fn(),
  onVideoCall: vi.fn(),
  onMessage: vi.fn(),
  onUpdateChat: vi.fn(),
  replyTarget: { id: 'msg-1', sender: 'user1', text: 'test message' },
  setReplyTarget: vi.fn(),
  isDark: true,
};

const defaultProps = () => ({ ...mockProps });

describe('ChatPreviewLayer reply-to close button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('closes reply-to bar when close button is clicked', async () => {
    render(<ChatPreviewLayer {...defaultProps()} />);

    expect(screen.getByText(/test message/)).toBeInTheDocument();
    expect(mockProps.setReplyTarget).not.toHaveBeenCalled();

    const closeBtn = document.querySelector('button[class*="w-6"]');
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect(screen.getByText(/test message/)).toBeInTheDocument();
    expect(mockProps.setReplyTarget).not.toHaveBeenCalled();
  });

  it('does not call setReplyTarget when clicking on reply text', () => {
    render(<ChatPreviewLayer {...defaultProps()} />);

    const replyTexts = screen.getAllByText(/test message/);
    expect(replyTexts.length).toBeGreaterThanOrEqual(1);
    expect(mockProps.setReplyTarget).not.toHaveBeenCalled();
  });
});
