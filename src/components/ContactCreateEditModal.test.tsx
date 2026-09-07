import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactCreateEditModal } from './ContactCreateEditModal';

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    lang: 'en',
    setLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

describe('ContactCreateEditModal', () => {
  it('submit button has min-h-11 touch zone', () => {
    render(<ContactCreateEditModal onClose={vi.fn()} onSave={vi.fn()} />);

    const saveBtn = screen.getByRole('button', { name: 'contacts.saveContact' });
    expect(saveBtn.className).toContain('min-h-11');
  });
});
