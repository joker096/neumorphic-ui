import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CreateChannelModal } from './CreateChannelModal';

const mockSetChannels = vi.fn();

vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    channels: [],
    setChannels: mockSetChannels,
  })),
}));

vi.mock('../lib/crypto/channelSigning', () => ({
  generateChannelKeypair: vi.fn(() => ({
    publicKey: 'mock-pub',
    privateKey: 'mock-priv',
  })),
}));

vi.mock('../lib/crypto/postKeyManager', () => ({
  generatePostKey: vi.fn(() => ({
    id: 'mock-id',
    publicKey: 'mock-pub-key',
    privateKey: 'mock-priv-key',
    createdAt: Date.now(),
  })),
}));

const mockOnClose = vi.fn();

const defaultProps = {
  theme: 'dark' as const,
  onClose: mockOnClose,
};

describe('CreateChannelModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal', () => {
    render(<CreateChannelModal {...defaultProps} />);
    expect(screen.getByText('channel.createTitle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('channel.namePlaceholder')).toBeInTheDocument();
  });

  it('create button is disabled when name is empty', () => {
    render(<CreateChannelModal {...defaultProps} />);
    const button = screen.getByText('channel.create').closest('button');
    expect(button).toBeDisabled();
  });

  it('create button is enabled when name is entered', () => {
    render(<CreateChannelModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('channel.namePlaceholder');
    fireEvent.change(input, { target: { value: 'My Channel' } });
    const button = screen.getByText('channel.create').closest('button');
    expect(button).not.toBeDisabled();
  });

  it('toggles between public and private', () => {
    render(<CreateChannelModal {...defaultProps} />);
    expect(screen.getByText('channel.public')).toBeInTheDocument();
    expect(screen.getByText('channel.private')).toBeInTheDocument();
    fireEvent.click(screen.getByText('channel.private'));
    expect(screen.getByText('channel.private').closest('div[class*="flex-1"]')?.className).toContain('border-blue-500');
  });

  it('calls onClose when X is clicked', () => {
    render(<CreateChannelModal {...defaultProps} />);
    const closeBtn = screen.getByText('channel.createTitle').closest('div')?.querySelector('[class*="rounded-full"]');
    fireEvent.click(closeBtn!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose and creates channel on submit', () => {
    render(<CreateChannelModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('channel.namePlaceholder');
    fireEvent.change(input, { target: { value: 'TestChan' } });
    fireEvent.click(screen.getByText('channel.create'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('applies dark theme', () => {
    render(<CreateChannelModal {...defaultProps} />);
    const modal = screen.getByText('channel.createTitle').closest('div[class*="max-w-sm"]');
    expect(modal?.className).toContain('bg-[#1a1d24]');
  });

  it('applies light theme', () => {
    render(<CreateChannelModal {...defaultProps} theme="light" />);
    const modal = screen.getByText('channel.createTitle').closest('div[class*="max-w-sm"]');
    expect(modal?.className).toContain('bg-white');
  });
});
