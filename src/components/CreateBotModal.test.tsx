import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CreateBotModal } from './CreateBotModal';

const mockSetBots = vi.fn();

vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    bots: [],
    setBots: mockSetBots,
  })),
}));

vi.mock('../lib/deviceSecurity', () => ({
  deviceSecurity: {
    getDeviceFingerprint: vi.fn().mockResolvedValue('mock-fingerprint'),
  },
}));

vi.mock('../lib/crypto/cryptoCore', () => ({
  buf2hex: vi.fn(() => 'deadbeef'),
}));

const mockOnClose = vi.fn();

const defaultProps = {
  theme: 'dark' as const,
  onClose: mockOnClose,
};

describe('CreateBotModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'crypto', {
      value: {
        subtle: {
          generateKey: vi.fn().mockResolvedValue({
            publicKey: {},
            privateKey: {},
          }),
          exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
          digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        },
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders the modal', () => {
    render(<CreateBotModal {...defaultProps} />);
    expect(screen.getByText('bot.createTitle')).toBeInTheDocument();
  });

  it('create button is disabled when name is empty', () => {
    render(<CreateBotModal {...defaultProps} />);
    const button = screen.getByText('bot.generateToken').closest('button');
    expect(button).toBeDisabled();
  });

  it('create button is enabled when name is entered', () => {
    render(<CreateBotModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('bot.namePlaceholder');
    fireEvent.change(input, { target: { value: 'TestBot' } });
    const button = screen.getByText('bot.generateToken').closest('button');
    expect(button).not.toBeDisabled();
  });

  it('calls onClose when X is clicked', () => {
    render(<CreateBotModal {...defaultProps} />);
    const xDiv = screen.getByText('bot.createTitle').closest('[class*="max-w-sm"]')!.querySelector('[class*="rounded-full"]');
    fireEvent.click(xDiv!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('applies dark theme', () => {
    render(<CreateBotModal {...defaultProps} />);
    const modal = screen.getByText('bot.createTitle').closest('[class*="max-w-sm"]');
    expect(modal?.className).toContain('bg-[#1a1d24]');
  });

  it('applies light theme', () => {
    render(<CreateBotModal {...defaultProps} theme="light" />);
    const modal = screen.getByText('bot.createTitle').closest('[class*="max-w-sm"]');
    expect(modal?.className).toContain('bg-white');
  });
});
