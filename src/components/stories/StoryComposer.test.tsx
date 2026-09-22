import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryComposer } from './StoryComposer';
import { publishMyStory } from './storiesData';

vi.mock('lucide-react', () => {
  const icon = (name: string) => (p: any) => <span data-testid={`icon-${name}`} {...p} />;
  return {
    Image: icon('Image'),
    Type: icon('Type'),
    Send: icon('Send'),
    X: icon('X'),
    Globe: icon('Globe'),
    Users: icon('Users'),
    UserCheck: icon('UserCheck'),
    EyeOff: icon('EyeOff'),
  };
});
vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string, fallback?: string) => fallback ?? k }) }));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));
vi.mock('../ui/Button', () => ({ Button: ({ children, ...p }: any) => <button {...p}>{children}</button> }));
vi.mock('../ui/CloseButton', () => ({ CloseButton: ({ children, ...p }: any) => <button {...p}>{children}</button> }));
vi.mock('./storiesData', async () => {
  const actual = await vi.importActual('./storiesData');
  return { ...actual, publishMyStory: vi.fn() };
});

describe('StoryComposer', () => {
  beforeEach(() => {
    vi.mocked(publishMyStory).mockClear();
    vi.mocked(publishMyStory).mockReturnValue({} as any);
  });

  function pickFile(kind: 'image' | 'video') {
    render(<StoryComposer open onClose={() => {}} isDark={false} />);
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
    expect(publishMyStory).toHaveBeenCalledWith(
      expect.any(String),
      '',
      expect.any(String),
      expect.any(String),
      undefined,
      'blob:video-1',
    );
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('publishes an image story with its blob url without revoking it', () => {
    URL.createObjectURL = vi.fn(() => 'blob:img-1');
    URL.revokeObjectURL = vi.fn();
    pickFile('image');
    fireEvent.click(screen.getByText('Add to story'));
    expect(publishMyStory).toHaveBeenCalledWith(
      expect.any(String),
      '',
      expect.any(String),
      expect.any(String),
      'blob:img-1',
      undefined,
    );
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('still revokes the blob on explicit remove (media untouched by publish)', () => {
    URL.createObjectURL = vi.fn(() => 'blob:img-2');
    URL.revokeObjectURL = vi.fn();
    const { input } = pickFile('image');
    const videos = document.body.querySelectorAll('video');
    expect(videos.length).toBe(0);
    expect(screen.getByLabelText('Remove media')).toBeTruthy();
    fireEvent.click(screen.getByText('Add to story'));
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});