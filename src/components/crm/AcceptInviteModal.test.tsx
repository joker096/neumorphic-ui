import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AcceptInviteModal } from './AcceptInviteModal';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (k: string, f: string) => f }),
}));

describe('AcceptInviteModal (visual)', () => {
  it('renders the invite code and accepts', () => {
    const onAccept = vi.fn();
    render(<AcceptInviteModal code="INV-ABC" onAccept={onAccept} onClose={() => {}} />);
    expect(screen.getByText('INV-ABC')).toBeTruthy();
    fireEvent.click(screen.getByText('Accept'));
    expect(onAccept).toHaveBeenCalled();
  });

  it('cancels via the Cancel button', () => {
    const onClose = vi.fn();
    render(<AcceptInviteModal code="INV-ABC" onAccept={() => {}} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
