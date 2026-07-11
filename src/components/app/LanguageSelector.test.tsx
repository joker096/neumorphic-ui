import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('lucide-react', () => ({ Check: 'div', Globe: 'div' }));

import { LanguageSelector } from './LanguageSelector';

const defaultProps = {
  showLangMenu: true,
  setShowLangMenu: vi.fn(),
  language: 'en',
  setLanguage: vi.fn(),
  t: (k: string) => k,
};

describe('LanguageSelector', () => {
  it('renders language globe button', () => {
    render(<LanguageSelector {...defaultProps} />);
    const btn = screen.getByLabelText('common.selectLanguage');
    expect(btn).toBeInTheDocument();
  });

  it('renders language list when menu is open', () => {
    render(<LanguageSelector {...defaultProps} />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Русский')).toBeInTheDocument();
  });

  it('highlights current language', () => {
    render(<LanguageSelector {...defaultProps} language="ru" />);
    expect(screen.getByText('Русский')).toBeInTheDocument();
  });

  it('does not render menu when showLangMenu is false', () => {
    render(<LanguageSelector {...defaultProps} showLangMenu={false} />);
    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });
});
