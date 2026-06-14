import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LightSearchBar } from './LightSearchBar';
import { I18nProvider } from '../../lib/i18n';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'chat.searchChats': 'Search chats or messages...',
      };
      return translations[key] || key;
    },
    lang: 'en',
    setLang: () => {},
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  detectBrowserLanguage: () => 'en',
}));

describe('LightSearchBar', () => {
  it('renders with default placeholder', () => {
    render(<I18nProvider><LightSearchBar /></I18nProvider>);
    const input = screen.getByPlaceholderText('Search chats or messages...');
    expect(input).toBeTruthy();
  });

  it('renders with custom placeholder', () => {
    render(<I18nProvider><LightSearchBar placeholder="Find..." /></I18nProvider>);
    expect(screen.getByPlaceholderText('Find...')).toBeTruthy();
  });

  it('uses controlled value when searchQuery is provided', () => {
    render(<I18nProvider><LightSearchBar searchQuery="hello" /></I18nProvider>);
    const input = screen.getByDisplayValue('hello') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('hello');
  });

  it('calls onSearchChange when controlled', () => {
    const handleChange = vi.fn();
    render(<I18nProvider><LightSearchBar searchQuery="" onSearchChange={handleChange} /></I18nProvider>);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new' } });
    expect(handleChange).toHaveBeenCalledWith('new');
  });

  it('renders search icon', () => {
    const { container } = render(<I18nProvider><LightSearchBar /></I18nProvider>);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});
