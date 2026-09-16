import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SharedMediaTabs } from './SharedMediaTabs';
import { resolveFtrBlobUrl } from '../../lib/fileTransfer/fileStore';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => fallback ?? key, lang: 'en', setLang: vi.fn() }),
}));

vi.mock('../../lib/fileTransfer/fileStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/fileTransfer/fileStore')>();
  return { ...actual, resolveFtrBlobUrl: vi.fn() };
});

if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: (blob: Blob) => `blob:mock-${blob.size}`,
  });
}

const renderTabs = (messages: any[]) => render(<SharedMediaTabs messages={messages} isDark={false} />);

describe('SharedMediaTabs', () => {
  beforeEach(() => {
    (resolveFtrBlobUrl as any).mockReset();
  });

  it('renders media grid for image and video messages', () => {
    const { container } = renderTabs([
      { id: 1, type: 'image', attachment: 'data:image/png;base64,x' },
      { id: 2, type: 'video', thumb: 'https://v/video.mp4', duration: '0:10' },
      { id: 3, type: 'text', text: 'hello' },
    ]);
    expect(container.querySelectorAll('img')).toHaveLength(2);
  });

  it('renders assembled blob for ftr1: p2p transfer once completed', async () => {
    (resolveFtrBlobUrl as any).mockResolvedValue({ url: 'blob:mock-1', shaOk: true });
    const { container } = renderTabs([
      { id: 7, type: 'image', attachment: 'ftr1:abc-123', fileTransferId: 'abc-123', text: 'p2p pic' },
    ]);
    const img = await screen.findByAltText('p2p pic');
    expect(img.getAttribute('src')).toBe('blob:mock-1');
    expect(container.querySelector('img[src*="ftr1:"]')).toBeNull();
  });

  it('does not leak raw ftr1: into img src while the transfer is pending', () => {
    (resolveFtrBlobUrl as any).mockResolvedValue(null);
    const { container } = renderTabs([
      { id: 8, type: 'image', attachment: 'ftr1:pending-id', fileTransferId: 'pending-id' },
    ]);
    expect(container.querySelector('img[src*="ftr1:"]')).toBeNull();
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
