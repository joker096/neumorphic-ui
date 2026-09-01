import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SharedMediaTabs } from './SharedMediaTabs';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => fallback ?? key, lang: 'en', setLang: vi.fn() }),
}));

const renderTabs = (messages: any[]) => render(<SharedMediaTabs messages={messages} isDark={false} />);

describe('SharedMediaTabs', () => {
  it('renders media grid for image and video messages', () => {
    const { container } = renderTabs([
      { id: 1, type: 'image', attachment: 'data:image/png;base64,x' },
      { id: 2, type: 'video', thumb: 'https://v/video.mp4', duration: '0:10' },
      { id: 3, type: 'text', text: 'hello' },
    ]);
    expect(container.querySelectorAll('img')).toHaveLength(2);
  });

  it('shows empty state when there is no media', () => {
    renderTabs([{ id: 1, type: 'text', text: 'hi' }]);
    expect(screen.getByText('No media yet')).toBeDefined();
  });

  it('lists links extracted from message text', () => {
    const { baseElement } = renderTabs([
      { id: 1, type: 'text', text: 'check https://example.com please' },
      { id: 2, type: 'text', text: 'no url here' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Links' }));
    expect(baseElement.textContent).toContain('https://example.com');
  });

  it('lists voice messages with duration and files', () => {
    const { baseElement } = renderTabs([
      { id: 1, type: 'audio', duration: '0:05' },
      { id: 2, type: 'file', fileName: 'report.pdf' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Voice' }));
    expect(baseElement.textContent).toContain('0:05');
    fireEvent.click(screen.getByRole('button', { name: 'Files' }));
    expect(baseElement.textContent).toContain('report.pdf');
  });
});
