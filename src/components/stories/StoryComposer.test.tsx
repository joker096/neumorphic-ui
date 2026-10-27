import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryComposer } from './StoryComposer';

vi.mock('lucide-react', () => {
  const icon = (name: string) => (p: any) => <span data-testid={`icon-${name}`} {...p} />;
  return {
    Image: icon('Image'),
    Send: icon('Send'),
    X: icon('X'),
  };
});
vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string, fallback?: string) => fallback ?? k }) }));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));
vi.mock('../ui/Button', () => ({ Button: ({ children, ...p }: any) => <button {...p}>{children}</button> }));
vi.mock('../ui/CloseButton', () => ({ CloseButton: ({ children, ...p }: any) => <button {...p}>{children}</button> }));

const mockPublish = vi.fn();
vi.mock('../../features/stories/storiesStore', () => ({
  useStoriesStore: Object.assign(
    (selector?: any) => (selector ? { publishMyStory: mockPublish } : {}),
    { getState: () => ({ publishMyStory: mockPublish }) }
  ),
}));

describe('StoryComposer', () => {
  beforeEach(() => {
    mockPublish.mockClear();
    mockPublish.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function pickFile(kind: 'image' | 'video') {
    render(<StoryComposer open onClose={() => {}} />);
    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    const file = new File([kind === 'video' ? 'video-bytes' : 'image-bytes'], kind === 'video' ? 'clip.mp4' : 'pic.png', { type: kind === 'video' ? 'video/mp4' : 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    return { input };
  }

  it('publishes a video story with its blob url (regression: url stays alive)', () => {
    URL.createObjectURL = vi.fn(() => 'blob:video-1');
    URL.revokeObjectURL = vi.fn();
    pickFile('video');
    expect(document.body.querySelector('video')?.getAttribute('src')).toBe('blob:video-1');
    fireEvent.click(screen.getByText('Add to story'));
    expect(mockPublish).toHaveBeenCalledWith({
      media: { kind: 'video', src: 'blob:video-1' },
      caption: '',
    });
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('publishes an image story with its blob url without revoking it', () => {
    URL.createObjectURL = vi.fn(() => 'blob:img-1');
    URL.revokeObjectURL = vi.fn();
    pickFile('image');
    fireEvent.click(screen.getByText('Add to story'));
    expect(mockPublish).toHaveBeenCalledWith({
      media: { kind: 'image', src: 'blob:img-1' },
      caption: '',
    });
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('does not publish when no media is selected', () => {
    render(<StoryComposer open onClose={() => {}} />);
    expect(screen.getByText('Add to story')).toBeDisabled();
    fireEvent.click(screen.getByText('Add to story'));
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('revokes the blob on explicit remove', () => {
    URL.createObjectURL = vi.fn(() => 'blob:img-2');
    URL.revokeObjectURL = vi.fn();
    pickFile('image');
    fireEvent.click(screen.getByLabelText('Remove media'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:img-2');
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('passes trimmed caption through to store', () => {
    URL.createObjectURL = vi.fn(() => 'blob:img-3');
    URL.revokeObjectURL = vi.fn();
    pickFile('image');
    fireEvent.change(document.body.querySelector('textarea') as HTMLTextAreaElement, { target: { value: '  Hello stories  ' } });
    fireEvent.click(screen.getByText('Add to story'));
    expect(mockPublish).toHaveBeenCalledWith({
      media: { kind: 'image', src: 'blob:img-3' },
      caption: 'Hello stories',
    });
  });
});
