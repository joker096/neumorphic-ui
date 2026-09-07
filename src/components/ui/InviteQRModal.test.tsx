import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { InviteQRModal } from './InviteQRModal';

describe('InviteQRModal', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  it('copy link button has min-h-11 touch zone', () => {
    render(<InviteQRModal isOpen onClose={() => {}} inviteText="https://invite.example/abc" t={(key) => key} />);

    const copyBtn = screen.getByRole('button', { name: 'header.copyLink' });
    expect(copyBtn.className).toContain('min-h-11');
  });
});
