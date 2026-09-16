import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatMediaPanel } from './ChatMediaPanel';
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

const baseProps = (over: any = {}) => ({
  isDark: false,
  showMediaPanel: true,
  showFilterMenu: false,
  setShowFilterMenu: vi.fn(),
  filterBySender: '',
  setFilterBySender: vi.fn(),
  filterStartDate: '',
  setFilterStartDate: vi.fn(),
  filterEndDate: '',
  setFilterEndDate: vi.fn(),
  mediaTab: 'all',
  setMediaTab: vi.fn(),
  mediaItems: [],
  setActivePhotoUrl: vi.fn(),
  setPhotoOpen: vi.fn(),
t: (key: string, fallback?: any) => (typeof fallback === 'string' ? fallback : key),
  ...over,
});

describe('ChatMediaPanel', () => {
  beforeEach(() => {
    (resolveFtrBlobUrl as any).mockReset();
  });

  it('renders plain image tile for normal attachment', () => {
    const { container } = render(<ChatMediaPanel {...baseProps({ mediaItems: [{ id: 1, type: 'image', attachment: 'data:image/png;base64,x' }] })} />);
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('renders audio tile without an image', () => {
    const { container } = render(<ChatMediaPanel {...baseProps({ mediaItems: [{ id: 2, type: 'audio', duration: '0:05' }] })} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('0:05');
  });

  it('resolves ftr1: attachment and opens viewer with blob url', async () => {
    (resolveFtrBlobUrl as any).mockResolvedValue({ url: 'blob:mock-1', shaOk: true });
    const setActivePhotoUrl = vi.fn();
    const setPhotoOpen = vi.fn();
    render(<ChatMediaPanel {...baseProps({
      mediaItems: [{ id: 3, type: 'image', attachment: 'ftr1:abc', fileTransferId: 'abc', text: 'p2p' }],
      setActivePhotoUrl,
      setPhotoOpen,
    })} />);
    const img = await screen.findByAltText('Shared image: p2p');
    expect(img.getAttribute('src')).toBe('blob:mock-1');
    fireEvent.click(img);
    expect(setActivePhotoUrl).toHaveBeenCalledWith('blob:mock-1');
    expect(setPhotoOpen).toHaveBeenCalledWith(true);
  });

  it('shows placeholder instead of raw ftr1: while pending and blocks viewer open', () => {
    (resolveFtrBlobUrl as any).mockResolvedValue(null);
    const setActivePhotoUrl = vi.fn();
    const { container } = render(<ChatMediaPanel {...baseProps({
      mediaItems: [{ id: 4, type: 'image', attachment: 'ftr1:pending', fileTransferId: 'pending' }],
      setActivePhotoUrl,
    })} />);
    expect(container.querySelector('img[src*="ftr1:"]')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    fireEvent.click(container.querySelector('[role="button"]')!);
    expect(setActivePhotoUrl).not.toHaveBeenCalled();
  });
});