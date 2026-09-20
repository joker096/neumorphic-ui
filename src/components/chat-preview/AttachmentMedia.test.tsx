import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AttachmentMedia } from './AttachmentMedia';
import { getTransferMeta, getTransferBlob } from '../../lib/fileTransfer/fileStore';
import { sha256Hex } from '../../lib/fileTransfer/integrity';

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string, fallback?: string) => fallback ?? k }) }));
vi.mock('../stories/StoryCard', () => ({
  StoryCard: (p: any) => <div data-testid="mock-story-card" data-story={JSON.stringify(p.story)} />,
}));
vi.mock('../../lib/fileTransfer/fileStore', () => ({
  getTransferMeta: vi.fn(),
  getTransferBlob: vi.fn(),
}));
vi.mock('../../lib/fileTransfer/integrity', () => ({
  sha256Hex: vi.fn(async () => 'abc'),
}));

// jsdom may lack URL.createObjectURL; provide a deterministic stand-in.
if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: (blob: Blob) => `blob:mock-${blob.size}`,
  });
}

function baseProps(over: any = {}) {
  return {
    msg: {},
    isMe: true,
    isDark: false,
    stickerSrc: null,
    onSetActivePhotoUrl: vi.fn(),
    onSetPhotoOpen: vi.fn(),
    onSetVideoOpen: vi.fn(),
    ...over,
  };
}

function ftrMsg(over: any = {}) {
  return {
    id: 1,
    sender: 'Alice',
    text: '',
    type: 'file',
    attachment: `ftr1:${over.transferId ?? 't'}`,
    fileName: 'report.pdf',
    fileSize: 128,
    fileTransferId: over.transferId ?? 't',
    time: '12:00',
    status: 'delivered',
    silent: false,
    ...over,
  };
}

describe('AttachmentMedia story handling', () => {
  it('renders StoryCard for a story message', () => {
    const story = { userId: 1, userName: 'Alice', storyId: 11, caption: 'hi' };
    render(<AttachmentMedia {...baseProps({ msg: { type: 'story', story } })} />);
    expect(screen.getByTestId('mock-story-card')).toBeTruthy();
  });

  it('forwards the story payload to StoryCard', () => {
    const story = { userId: 2, storyId: 22 };
    render(<AttachmentMedia {...baseProps({ msg: { type: 'story', story } })} />);
    const node = screen.getByTestId('mock-story-card');
    expect(JSON.parse(node.getAttribute('data-story')!)).toEqual(story);
  });

  it('does not render story card for a payment message', () => {
    const { container } = render(<AttachmentMedia {...baseProps({ msg: { type: 'payment', paymentToken: 't' } })} />);
    expect(container.querySelector('[data-testid="mock-story-card"]')).toBeNull();
  });
});

describe('AttachmentMedia image size pill', () => {
  it('shows a size overlay on image when fileSize is present', () => {
    render(<AttachmentMedia {...baseProps({ msg: { type: 'image', url: 'http://x/pic.png', fileName: 'pic.png', fileSize: 204800, text: '' } })} />);
    expect(screen.getByText('200 KB')).toBeTruthy();
  });

  it('hides the size pill on image without fileSize', () => {
    render(<AttachmentMedia {...baseProps({ msg: { type: 'image', url: 'http://x/pic.png', fileName: 'pic.png', text: '' } })} />);
    expect(screen.queryByText(/KB|MB|GB/)).toBeNull();
  });
});

describe('AttachmentMedia ftr1: receive path', () => {
  beforeEach(() => {
    (getTransferMeta as any).mockReset();
    (getTransferBlob as any).mockReset();
    (sha256Hex as any).mockReset();
    (sha256Hex as any).mockResolvedValue('abc');
  });

  it('shows a pending row without download while the transfer is incomplete', async () => {
    (getTransferMeta as any).mockResolvedValue({ transferId: 't-pending', totalChunks: 1, completed: false });
    render(<AttachmentMedia {...baseProps({ msg: ftrMsg({ transferId: 't-pending' }) })} />);
    expect(screen.getByText('report.pdf')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Download' })).toBeNull();
  });

  it('renders a download link once the file transfer completes', async () => {
    (getTransferMeta as any).mockResolvedValue({ transferId: 't-file', totalChunks: 1, completed: true });
    (getTransferBlob as any).mockResolvedValue(new Blob(['x']));
    render(<AttachmentMedia {...baseProps({ msg: ftrMsg({ transferId: 't-file' }) })} />);
    const link = await screen.findByRole('link', { name: 'Download' });
    expect(link.getAttribute('href')).toMatch(/^blob:/);
    expect(link.getAttribute('download')).toBe('report.pdf');
  });

  it('renders the assembled blob as an image once the transfer completes', async () => {
    (getTransferMeta as any).mockResolvedValue({ transferId: 't-img', totalChunks: 1, completed: true });
    (getTransferBlob as any).mockResolvedValue(new Blob(['x']));
    render(<AttachmentMedia {...baseProps({ msg: ftrMsg({ transferId: 't-img', type: 'image' }) })} />);
    const img = await screen.findByAltText('chat.sharedImage');
    expect(img.getAttribute('src')).toMatch(/^blob:/);
  });

  it('renders an inline playable video once the transfer completes', async () => {
    (getTransferMeta as any).mockResolvedValue({ transferId: 't-vid', totalChunks: 1, completed: true });
    (getTransferBlob as any).mockResolvedValue(new Blob(['x']));
    const { container } = render(<AttachmentMedia {...baseProps({ msg: ftrMsg({ transferId: 't-vid', type: 'video' }) })} />);
    await waitFor(() => {
      const video = container.querySelector('video');
      expect(video).not.toBeNull();
      expect(video?.getAttribute('src')).toMatch(/^blob:/);
    });
  });

  it('shows unavailable when the received sha256 does not match', async () => {
    (getTransferMeta as any).mockResolvedValue({ transferId: 't-sha', totalChunks: 1, completed: true, sha256: 'bad' });
    (getTransferBlob as any).mockResolvedValue(new Blob(['x']));
    (sha256Hex as any).mockResolvedValueOnce('abc');
    render(<AttachmentMedia {...baseProps({ msg: ftrMsg({ transferId: 't-sha' }) })} />);
    expect(await screen.findByText('Attachment unavailable')).toBeTruthy();
  });
});

describe('AttachmentMedia media layout', () => {
  it('renders a plain image without the photo status chip', () => {
    render(
      <AttachmentMedia {...baseProps({ msg: { type: 'image', attachment: 'data:image/png;base64,x', text: '' } })} />,
    );
    const img = screen.getByAltText('chat.sharedImage');
    expect(img.className).toContain('object-contain');
    expect(img.className).not.toContain('object-cover');
    expect(screen.queryByText('chat.filters.photo')).toBeNull();
  });

  it('renders a responsive 16:9 video thumbnail with a duration badge', () => {
    render(
      <AttachmentMedia {...baseProps({ msg: { type: 'video', thumb: 'data:image/png;base64,x', duration: '1:05' } })} />,
    );
    const thumb = screen.getByAltText('a11y.videoThumbnail');
    expect(thumb.className).toContain('aspect-video');
    expect(screen.getByText('1:05')).toBeTruthy();
  });

  it('tints the file tile by file kind', () => {
    const { container, unmount } = render(
      <AttachmentMedia {...baseProps({ msg: { type: 'file', attachment: '/x.xlsx', fileName: 'book.xlsx', fileSize: 100 } })} />,
    );
    expect(container.querySelector('[class*="bg-emerald-500/15"]')).not.toBeNull();
    unmount();

    const { container: pdfContainer } = render(
      <AttachmentMedia {...baseProps({ msg: { type: 'file', attachment: '/x.pdf', fileName: 'report.pdf', fileSize: 100 } })} />,
    );
    expect(pdfContainer.querySelector('[class*="bg-rose-500/15"]')).not.toBeNull();
  });
});
