import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CrmInviteModal } from './CrmInviteModal';

vi.mock('qrcode', () => ({
  default: { toDataURL: () => Promise.resolve('data:image/png;base64,xxx') },
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (k: string, f: string) => f }),
}));

vi.mock('../../store', () => ({
  useAppStore: (sel: any) => sel({ ensureCrmInviteCode: () => 'INV-TEST123' }),
}));

describe('CrmInviteModal (visual)', () => {
  it('shows the invite link inline with a copy button', async () => {
    render(<CrmInviteModal onClose={() => {}} />);
    await screen.findByText('INV-TEST123', { exact: true });
    const link = screen.getByText((c) => c.includes('INV-TEST123') && c.includes('nexus://company/invite'));
    expect(link).toBeTruthy();
    expect(screen.getByLabelText('Copy invite link')).toBeTruthy();
  });
});
