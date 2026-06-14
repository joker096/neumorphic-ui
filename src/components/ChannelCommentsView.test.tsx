import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChannelCommentsView } from './ChannelCommentsView';

vi.mock('../lib/crypto/MessageEncryptionService', () => ({
  messageEncryption: {
    encrypt: vi.fn().mockResolvedValue({ ciphertext: 'mock', nonce: 'mock', publicKey: 'mock', messageHash: 'mock', senderPublicKey: 'mock', timestamp: Date.now() }),
  },
}));

vi.mock('../lib/p2p/network', () => ({
  p2pNetwork: {
    broadcast: vi.fn(),
  },
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  postId: 1,
  postKey: 'mockPostKey',
  theme: 'dark' as const,
  channelChatId: 'chan_123',
};

describe('ChannelCommentsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<ChannelCommentsView {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('comments.title')).not.toBeInTheDocument();
  });

  it('renders comments panel when open', () => {
    render(<ChannelCommentsView {...defaultProps} />);
    expect(screen.getByText('comments.title')).toBeInTheDocument();
    expect(screen.getByText('Alice Freeman')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows comment count', () => {
    render(<ChannelCommentsView {...defaultProps} />);
    expect(screen.getByText('comments.replies')).toBeInTheDocument();
  });

  it('has an input field for new comments', () => {
    render(<ChannelCommentsView {...defaultProps} />);
    expect(screen.getByPlaceholderText('comments.placeholder')).toBeInTheDocument();
  });

  it('applies dark theme', () => {
    render(<ChannelCommentsView {...defaultProps} />);
    expect(screen.getByText('comments.title').className).toContain('text-white');
  });

  it('applies light theme', () => {
    render(<ChannelCommentsView {...defaultProps} theme="light" />);
    expect(screen.getByRole('heading', { name: 'comments.title' }).className).toContain('text-slate-800');
  });

  it('calls onClose when close button clicked', () => {
    render(<ChannelCommentsView {...defaultProps} />);
    const svg = screen.getByText('comments.title').closest('[class*="flex"]')?.querySelector('svg');
    if (svg) fireEvent.click(svg.closest('[class*="rounded-full"]')!);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
