import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PhotoViewerOverlay } from './PhotoViewer';
import { I18nProvider } from '../lib/i18n';

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'media.p2pEncrypted': 'P2P Encrypted Media',
        'media.fullView': 'Full view',
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

const defaultProps = {
  url: 'https://example.com/photo.jpg',
  open: true,
  onClose: vi.fn(),
  theme: 'dark' as const,
};

describe('PhotoViewerOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when open is false', () => {
    render(<I18nProvider><PhotoViewerOverlay {...defaultProps} open={false} /></I18nProvider>);
    expect(screen.queryByText('P2P Encrypted Media')).not.toBeInTheDocument();
  });

  it('does not render when url is null', () => {
    render(<I18nProvider><PhotoViewerOverlay {...defaultProps} url={null} /></I18nProvider>);
    expect(screen.queryByText('P2P Encrypted Media')).not.toBeInTheDocument();
  });

  it('renders when open with url', () => {
    render(<I18nProvider><PhotoViewerOverlay {...defaultProps} /></I18nProvider>);
    expect(screen.getByText('P2P Encrypted Media')).toBeInTheDocument();
    const img = screen.getByAltText('Full view');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('calls onClose when X close button clicked', () => {
    render(<I18nProvider><PhotoViewerOverlay {...defaultProps} /></I18nProvider>);
    const toolbar = screen.getByText('P2P Encrypted Media').closest('[class*="fixed"]')?.querySelector('[class*="absolute top-0"]');
    const buttons = toolbar?.querySelectorAll('button');
    const closeBtn = buttons?.[buttons.length - 1];
    fireEvent.click(closeBtn!);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when background clicked', () => {
    render(<I18nProvider><PhotoViewerOverlay {...defaultProps} /></I18nProvider>);
    const backdrop = screen.getByText('P2P Encrypted Media').closest('[class*="fixed"]')!;
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders with light theme', () => {
    render(<I18nProvider><PhotoViewerOverlay {...defaultProps} theme="light" /></I18nProvider>);
    expect(screen.getByText('P2P Encrypted Media')).toBeInTheDocument();
  });
});
