import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AccountSwitcher } from './AccountSwitcher';
import { I18nProvider } from '../lib/i18n';

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, args?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        'common.accounts': 'Accounts',
        'common.newAccountName': 'New Account Name...',
        'common.addAccount': 'Add Account',
      };
      let text = translations[key] || key;
      if (args) {
        for (const [k, v] of Object.entries(args)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
      }
      return text;
    },
    lang: 'en',
    setLang: () => {},
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  detectBrowserLanguage: () => 'en',
}));

describe('AccountSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the active account initial', () => {
    render(<I18nProvider><AccountSwitcher theme="dark" /></I18nProvider>);
    expect(screen.getByText('N')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<I18nProvider><AccountSwitcher theme="dark" /></I18nProvider>);
    fireEvent.click(screen.getByText('N'));
    expect(screen.getByText('Nexus Terminal')).toBeInTheDocument();
    expect(screen.getByText('Work Node')).toBeInTheDocument();
  });

  it('switches active account on click', () => {
    render(<I18nProvider><AccountSwitcher theme="dark" /></I18nProvider>);
    fireEvent.click(screen.getByText('N'));
    fireEvent.click(screen.getByText('Work Node'));
    expect(screen.getAllByText('W').length).toBe(2);
  });

  it('shows add account input when add button clicked', () => {
    render(<I18nProvider><AccountSwitcher theme="dark" /></I18nProvider>);
    fireEvent.click(screen.getByText('N'));
    fireEvent.click(screen.getByText('Add Account'));
    expect(screen.getByPlaceholderText('New Account Name...')).toBeInTheDocument();
  });

  it('adds a new account', () => {
    render(<I18nProvider><AccountSwitcher theme="dark" /></I18nProvider>);
    fireEvent.click(screen.getByText('N'));
    fireEvent.click(screen.getByText('Add Account'));
    const input = screen.getByPlaceholderText('New Account Name...');
    fireEvent.change(input, { target: { value: 'Test Account' } });
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('applies dark theme classes', () => {
    render(<I18nProvider><AccountSwitcher theme="dark" /></I18nProvider>);
    fireEvent.click(screen.getByText('N'));
    expect(screen.getByText('Accounts').className).toContain('text-gray-500');
  });

  it('applies light theme classes', () => {
    render(<I18nProvider><AccountSwitcher theme="light" /></I18nProvider>);
    fireEvent.click(screen.getByText('N'));
    expect(screen.getByText('Accounts').className).toContain('text-slate-400');
  });
});
