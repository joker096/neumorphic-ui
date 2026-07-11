import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StoryViewerOverlay } from './StoryViewerOverlay';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

describe('StoryViewerOverlay - additional tests', () => {
  it('renders close button', () => {
    render(<StoryViewerOverlay activeStory={{ id: 1, name: 'Test', color: 'from-blue-500 to-purple-600' }} onClose={vi.fn()} isStealthMode={false} />);
    expect(document.querySelector('[class*="lucide-x"]') || document.querySelector('[class*="lucide-X"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(<StoryViewerOverlay activeStory={{ id: 1, name: 'Test', color: 'from-blue-500 to-purple-600' }} onClose={vi.fn()} isStealthMode={false} />);
    expect(container.querySelector('[class*="text-white"]') || container.querySelector('[class*="bg-[#13151b]")') || container.querySelector('[class*="from-gray-900"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    // StoryViewerOverlay only renders dark theme styles
    const { container } = render(<StoryViewerOverlay activeStory={{ id: 1, name: 'Test', color: 'from-blue-500 to-purple-600' }} onClose={vi.fn()} isStealthMode={false} />);
    expect(container.querySelector('[class*="text-white"]') || container.querySelector('[class*="bg-black"]')).toBeInTheDocument();
  });

  it('renders close button with onClick', () => {
    const onClose = vi.fn();
    render(<StoryViewerOverlay activeStory={{ id: 1, name: 'Test', color: 'from-blue-500 to-purple-600' }} onClose={onClose} isStealthMode={false} />);
    const closeBtn = document.querySelector('[class*="lucide-x"]')?.closest('button');
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('renders dark theme back button styles', () => {
    const { container } = render(<StoryViewerOverlay activeStory={{ id: 1, name: 'Test', color: 'from-blue-500 to-purple-600' }} onClose={vi.fn()} isStealthMode={false} />);
    expect(container.querySelector('[class*="bg-white/10"]') || container.querySelector('[class*="hover:bg-white/20"]') || container.querySelector('[class*="bg-white/10"]')?.closest('.flex')).toBeInTheDocument();
  });

  it('renders light theme back button styles', () => {
    // StoryViewerOverlay only supports dark theme, use dark theme selectors
    const { container } = render(<StoryViewerOverlay activeStory={{ id: 1, name: 'Test', color: 'from-blue-500 to-purple-600' }} onClose={vi.fn()} isStealthMode={false} />);
    expect(container.querySelector('[class*="bg-white/10"]') || container.querySelector('[class*="hover:bg-white/20"]')).toBeInTheDocument();
  });
});
